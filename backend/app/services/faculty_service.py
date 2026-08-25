"""
Faculty service: handles DB operations and orchestrates syncs across connectors.
"""
import logging
from typing import Dict, Any, List
from app.core.supabase import get_supabase_admin
from app.services.connectors import get_connector

logger = logging.getLogger(__name__)

def sync_source(faculty_id: str, source_type: str, url_or_id: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
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
    
    existing_pubs_res = supabase.table("publications").select("id, title, doi").eq("faculty_id", faculty_id).execute()
    existing_pubs = existing_pubs_res.data
    existing_titles = {p["title"].lower(): p for p in existing_pubs if p.get("title")}
    existing_dois = {p["doi"]: p for p in existing_pubs if p.get("doi")}
    
    for article in publications:
        title = article["title"]
        doi = article.get("doi")
        
        match = None
        if doi and doi in existing_dois:
            match = existing_dois[doi]
        elif title.lower() in existing_titles:
            match = existing_titles[title.lower()]
            
        pub_record = {
            "faculty_id": faculty_id,
            "title": title,
            "year": article.get("year"),
            "venue": article.get("venue"),
            "doi": doi,
            "citation_count": article.get("citation_count", 0),
            "source_type": source_type,
            "is_verified": True,
            "dedup_status": "unique" if not match else "candidate"
        }
        
        if match:
            pub_record["id"] = match["id"]
            supabase.table("publications").upsert(pub_record).execute()
            pubs_updated += 1
        else:
            supabase.table("publications").insert(pub_record).execute()
            pubs_added += 1

    supabase.table("faculty").update({"last_synced_at": "now()"}).eq("id", faculty_id).execute()

    return {
        "source": source_type,
        "status": "completed",
        "publicationsFound": len(publications),
        "publicationsAdded": pubs_added,
        "publicationsUpdated": pubs_updated,
        "citations": author_info["total_citations"],
        "hIndex": author_info["h_index"]
    }

def process_institutional_batch(csv_content: str) -> Dict[str, Any]:
    """
    Process an institutional data CSV upload batch.
    """
    supabase = get_supabase_admin()
    connector = get_connector("institutional")
    
    try:
        valid_rows = connector.validate(csv_content)
    except ValueError as e:
        raise ValueError(f"CSV Validation failed: {e}")

    result = connector.fetch_and_normalize(valid_rows)
    records = result.get("institutional_records", [])

    # Fetch all faculty to match
    faculty_res = supabase.table("faculty").select("id, canonical_email, employee_id").execute()
    faculty_list = faculty_res.data

    emp_id_map = {f["employee_id"]: f["id"] for f in faculty_list if f.get("employee_id")}
    email_map = {f["canonical_email"]: f["id"] for f in faculty_list if f.get("canonical_email")}

    records_imported = 0
    records_updated = 0
    unmatched_records = []
    
    for row in records:
        emp_id = row.get("employee_id")
        email = row.get("email")
        
        faculty_id = None
        if emp_id and emp_id in emp_id_map:
            faculty_id = emp_id_map[emp_id]
        elif email and email in email_map:
            faculty_id = email_map[email]
            
        if not faculty_id:
            unmatched_records.append(row)
            continue
            
        # Check for exact duplicate in DB (same faculty_id, category, title, year)
        dup_check = supabase.table("institutional_records").select("id").eq("faculty_id", faculty_id).eq("category", row["category"]).eq("title", row["title"]).eq("year", row["year"]).execute()
        
        record_data = {
            "faculty_id": faculty_id,
            "category": row["category"],
            "title": row["title"],
            "description": row["description"],
            "year": row["year"],
            "source_type": "institutional",
            "is_verified": True
        }
        
        if dup_check.data:
            record_data["id"] = dup_check.data[0]["id"]
            supabase.table("institutional_records").upsert(record_data).execute()
            records_updated += 1
        else:
            supabase.table("institutional_records").insert(record_data).execute()
            records_imported += 1
            
    # Insert unmatched records
    if unmatched_records:
        unmatched_inserts = []
        for ur in unmatched_records:
            unmatched_inserts.append({
                "employee_id": ur.get("employee_id"),
                "email": ur.get("email"),
                "category": ur.get("category"),
                "title": ur.get("title"),
                "description": ur.get("description"),
                "year": ur.get("year")
            })
        if unmatched_inserts:
            supabase.table("unmatched_institutional_records").insert(unmatched_inserts).execute()

    return {
        "status": "completed",
        "recordsReceived": len(records),
        "recordsImported": records_imported,
        "recordsUpdated": records_updated,
        "unmatchedFaculty": len(unmatched_records),
        "invalidRecords": 0,  # invalid rows were dropped in validate() or raised Exception
        "duplicatesDetected": records_updated
    }
