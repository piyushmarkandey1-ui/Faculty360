"""
Faculty service: handles DB operations and orchestrates syncs across connectors.
"""
import logging
from typing import Dict, Any, List
from app.core.tiger import get_tiger_admin
from app.services.connectors import get_connector
from app.services.normalization import normalize_title, normalize_doi
from app.services.resolution import resolve_publication, detect_conflicts

logger = logging.getLogger(__name__)

def sync_source(faculty_id: str, source_type: str, url_or_id: str) -> Dict[str, Any]:
    supabase = get_tiger_admin()
    connector = get_connector(source_type)
    
    try:
        identity = connector.validate(url_or_id)
    except ValueError as e:
        raise ValueError(f"Validation failed: {e}")

    try:
        result = connector.fetch_and_normalize(identity)
    except Exception as e:
        logger.error(f"{source_type} fetch failed for {faculty_id}: {e}")
        raise ValueError(f"Failed to fetch data from {source_type}: {e}")

    if result["status"] == "unavailable":
        return {
            "source": source_type,
            "status": "unavailable",
            "message": result.get("message", "Source unavailable")
        }

    author_info = result["author"]
    publications = result["publications"]
    
    # 1. Update academic_identities
    identity_data = {
        "faculty_id": faculty_id,
        "source_type": source_type,
        "external_id": author_info["external_id"],
        "profile_url": author_info["profile_url"],
        "is_verified": True
    }
    supabase.table("academic_identities").upsert(identity_data, on_conflict="faculty_id,source_type").execute()
    
    pubs_added = 0
    pubs_updated = 0
    
    # 2. Fetch existing publications to resolve against
    existing_pubs_res = supabase.table("publications").select("*").eq("faculty_id", faculty_id).execute()
    existing_pubs = existing_pubs_res.data
    
    all_conflicts = []
    pub_sources_inserts = []
    
    for article in publications:
        raw_title = article.get("title", "")
        raw_doi = article.get("doi")
        year = article.get("year")
        citation_count = article.get("citation_count", 0)
        venue = article.get("venue")
        
        norm_title = normalize_title(raw_title)
        norm_doi = normalize_doi(raw_doi)
        
        match, confidence = resolve_publication(norm_title, norm_doi, year, existing_pubs)
        
        if match:
            # Detect conflicts
            confs = detect_conflicts(faculty_id, match, article, source_type)
            if confs:
                all_conflicts.extend(confs)
                
            # Update existing unified publication
            pub_record = {
                "id": match["id"],
                "citation_count": max(match.get("citation_count", 0) or 0, citation_count or 0),
                "dedup_status": "duplicate" if confidence > 90 else "candidate"
            }
            # Only update if DOI is newly found
            if not match.get("doi") and norm_doi:
                pub_record["doi"] = norm_doi
                
            supabase.table("publications").upsert(pub_record).execute()
            
            # Record provenance
            pub_sources_inserts.append({
                "publication_id": match["id"],
                "source_type": source_type,
                "source_url": author_info.get("profile_url"),
                "original_title": raw_title,
                "original_year": year,
                "original_doi": raw_doi
            })
            pubs_updated += 1
            
        else:
            # Insert new unified publication
            pub_record = {
                "faculty_id": faculty_id,
                "title": raw_title,
                "normalized_title": norm_title,
                "year": year,
                "venue": venue,
                "doi": norm_doi,
                "citation_count": citation_count,
                "source_type": source_type,
                "is_verified": True,
                "dedup_status": "unique",
                "confidence": confidence if confidence > 0 else 100.0
            }
            new_pub_res = supabase.table("publications").insert(pub_record).execute()
            new_pub_id = new_pub_res.data[0]["id"]
            
            # Record provenance
            pub_sources_inserts.append({
                "publication_id": new_pub_id,
                "source_type": source_type,
                "source_url": author_info.get("profile_url"),
                "original_title": raw_title,
                "original_year": year,
                "original_doi": raw_doi
            })
            pubs_added += 1
            # Add to local cache for subsequent iterations
            existing_pubs.append(new_pub_res.data[0])

    # Batch insert provenance
    if pub_sources_inserts:
        # Ignore conflicts on unique constraints (publication_id, source_type)
        supabase.table("publication_sources").upsert(pub_sources_inserts, on_conflict="publication_id,source_type").execute()
        
    # Batch insert conflicts
    if all_conflicts:
        supabase.table("profile_conflicts").insert(all_conflicts).execute()
        
    # Update faculty metrics
    conflict_count_res = supabase.table("profile_conflicts").select("id", count="exact").eq("faculty_id", faculty_id).execute()
    total_conflicts = conflict_count_res.count or 0
    
    supabase.table("faculty").update({
        "last_synced_at": "now()",
        "conflict_count": total_conflicts
    }).eq("id", faculty_id).execute()

    return {
        "source": source_type,
        "status": "completed",
        "publicationsFound": len(publications),
        "publicationsAdded": pubs_added,
        "publicationsUpdated": pubs_updated,
        "citations": author_info.get("total_citations", 0),
        "hIndex": author_info.get("h_index", 0),
        "conflictsDetected": len(all_conflicts)
    }

def process_institutional_batch(csv_content: str, category_override: str = None, dry_run: bool = False) -> Dict[str, Any]:
    """
    Process an institutional data CSV upload batch with enhanced matching and profile updates.
    """
    import json
    from datetime import datetime, timezone
    from app.core.tiger import get_tiger_admin

    supabase = get_tiger_admin()
    connector = get_connector("institutional")
    
    try:
        valid_rows = connector.validate(csv_content, category_override=category_override)
    except ValueError as e:
        raise ValueError(f"CSV Validation failed: {e}")

    result = connector.fetch_and_normalize(valid_rows)
    records = result.get("institutional_records", [])

    faculty_res = supabase.table("faculty").select("id, canonical_email, employee_id, canonical_name").execute()
    faculty_list = faculty_res.data or []

    emp_id_map = {str(f["employee_id"]).strip(): f["id"] for f in faculty_list if f.get("employee_id")}
    email_map = {str(f["canonical_email"]).strip().lower(): f["id"] for f in faculty_list if f.get("canonical_email")}
    name_map = {str(f["canonical_name"]).strip().lower(): f["id"] for f in faculty_list if f.get("canonical_name")}
    id_map = {str(f["id"]).strip(): f["id"] for f in faculty_list if f.get("id")}
    faculty_by_id = {f["id"]: f for f in faculty_list}

    records_imported = 0
    records_updated = 0
    unmatched_records = []
    preview_data = []
    affected_faculty_ids = set()

    # Pre-fetch existing institutional records once for fast in-memory lookup
    existing_res = supabase.table("institutional_records").select("id, faculty_id, category, title, year").execute()
    existing_index = {
        (str(r["faculty_id"]), str(r.get("category", "")), str(r.get("title", "")).strip(), r.get("year", 0)): r["id"]
        for r in (existing_res.data or [])
    }
    
    inserts_to_execute = []
    updates_to_execute = []

    for row in records:
        emp_id = (row.get("employee_id") or "").strip()
        email = (row.get("email") or "").strip().lower()
        title = (row.get("title") or "").strip()
        year = row.get("year", 2026)
        
        faculty_id = None
        if emp_id and emp_id in emp_id_map:
            faculty_id = emp_id_map[emp_id]
        elif email and email in email_map:
            faculty_id = email_map[email]
        elif emp_id and emp_id in id_map:
            faculty_id = id_map[emp_id]
        elif title and title.lower() in name_map:
            faculty_id = name_map[title.lower()]
            
        if not faculty_id:
            unmatched_records.append(row)
            continue
            
        category_to_use = category_override if category_override else row.get("category", "teaching")
        if category_to_use:
            category_to_use = connector.normalize_category(category_to_use)
            
        lookup_key = (str(faculty_id), str(category_to_use), title, year)
        existing_id = existing_index.get(lookup_key)
        is_dup = existing_id is not None
        
        record_data: Dict[str, Any] = {
            "faculty_id": faculty_id,
            "employee_id": emp_id,
            "email": email,
            "category": category_to_use,
            "title": title,
            "description": row.get("description", ""),
            "year": year,
            "source_type": "institutional",
            "is_verified": True
        }

        if row.get("hours") is not None:
            record_data["hours"] = row["hours"]
        if row.get("feedback_score") is not None:
            record_data["feedback_score"] = row["feedback_score"]
        if row.get("raw_metadata"):
            record_data["details"] = json.dumps(row["raw_metadata"])
        
        matched_faculty = faculty_by_id.get(faculty_id, {})
        faculty_name = matched_faculty.get("canonical_name", "Unknown Faculty")

        preview_data.append({
            **record_data,
            "faculty_name": faculty_name,
            "is_duplicate": is_dup
        })
        
        if is_dup:
            record_data["id"] = existing_id
            updates_to_execute.append(record_data)
            affected_faculty_ids.add(faculty_id)
            records_updated += 1
        else:
            inserts_to_execute.append(record_data)
            # Register in existing_index to avoid within-batch duplicates
            existing_index[lookup_key] = "pending"
            affected_faculty_ids.add(faculty_id)
            records_imported += 1

    if not dry_run:
        for rec in updates_to_execute:
            try:
                supabase.table("institutional_records").upsert(rec).execute()
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Upsert record note: {e}")

        for rec in inserts_to_execute:
            try:
                supabase.table("institutional_records").insert(rec).execute()
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Insert record note: {e}")
            
    if unmatched_records and not dry_run:
        unmatched_inserts = []
        for ur in unmatched_records:
            unmatched_inserts.append({
                "employee_id": ur.get("employee_id"),
                "email": ur.get("email"),
                "category": category_override if category_override else ur.get("category"),
                "title": ur.get("title"),
                "description": ur.get("description"),
                "year": ur.get("year", 2026)
            })
        if unmatched_inserts:
            try:
                supabase.table("unmatched_institutional_records").insert(unmatched_inserts).execute()
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Unmatched records insert note: {e}")

    # If changes were committed, update last_synced_at timestamp for affected faculty
    if not dry_run and affected_faculty_ids:
        now_iso = datetime.now(timezone.utc).isoformat()
        for fid in affected_faculty_ids:
            try:
                supabase.table("faculty").update({"last_synced_at": now_iso}).eq("id", fid).execute()
            except Exception:
                pass

    return {
        "status": "completed" if not dry_run else "dry_run",
        "recordsReceived": len(records),
        "recordsImported": records_imported,
        "recordsUpdated": records_updated,
        "unmatchedFaculty": len(unmatched_records),
        "invalidRecords": 0,
        "duplicatesDetected": records_updated,
        "previewData": preview_data[:15] if dry_run else []
    }
