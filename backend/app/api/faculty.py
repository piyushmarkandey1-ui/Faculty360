from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
from app.core.auth import get_current_user, verify_faculty_access, log_audit, RequireRole
from app.schemas.faculty import SyncScholarRequest
from app.services import faculty_service

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

def validate_faculty_id(faculty_id: str):
    if not faculty_id or str(faculty_id).strip().lower() in ("undefined", "null", "none", ""):
        raise HTTPException(status_code=400, detail="Invalid faculty ID")

@router.post("")
async def create_faculty(payload: dict, user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    from app.services.auto_ingest import auto_sync_faculty_publications
    import asyncio
    supabase = get_supabase_admin()
    
    canonical_name = payload.get("name") or payload.get("canonical_name")
    if not canonical_name:
        raise HTTPException(status_code=400, detail="Faculty name is required")
        
    import uuid
    department = payload.get("department") or "Computer Science & Engineering"
    designation = payload.get("designation") or "Professor / Researcher"
    email = payload.get("email") or payload.get("canonical_email") or f"{canonical_name.lower().replace(' ', '.')}@academic.edu"
    emp_id = payload.get("empId") or payload.get("employee_id") or f"FAC-{uuid.uuid4().hex[:6].upper()}"
    institution_name = payload.get("institution") or payload.get("affiliation") or "Academic Institution"
    topics = payload.get("topics") or []
    
    # Platform identifiers
    scholar_id = payload.get("scholarId") or payload.get("scholar_id") or ""
    scholar_url = payload.get("scholar_url") or (f"https://scholar.google.com/citations?user={scholar_id}" if scholar_id else "")
    orcid_id = payload.get("orcidId") or payload.get("orcid_id") or ""
    orcid_url = payload.get("orcid_url") or (f"https://orcid.org/{orcid_id}" if orcid_id else "")
    s2_id = payload.get("semantic_scholar_id") or payload.get("semanticScholarId") or ""
    s2_url = payload.get("semantic_scholar_url") or (f"https://www.semanticscholar.org/author/{s2_id}" if s2_id else "")
    dblp_url = payload.get("dblp_url") or ""
    researchgate_slug = payload.get("researchgateSlug") or payload.get("researchgate_slug") or ""
    
    # Find or create institution by name so each professor gets the correct institution_id
    institution_id = None
    if institution_name and institution_name not in ("Academic Institution", ""):
        inst_lookup = supabase.table("institutions").select("id").ilike("name", institution_name).limit(1).execute()
        if inst_lookup.data:
            institution_id = inst_lookup.data[0]["id"]
        else:
            # Create a new institution record for this institution
            try:
                new_inst = supabase.table("institutions").insert({
                    "name": institution_name,
                    "code": institution_name[:20].upper().replace(" ", "_"),
                    "city": "",
                    "state": ""
                }).execute()
                institution_id = new_inst.data[0]["id"] if new_inst.data else None
            except Exception:
                pass
    
    # Fallback: use the first institution in the DB if we still don't have one
    if not institution_id:
        inst_res = supabase.table("institutions").select("id").limit(1).execute()
        institution_id = inst_res.data[0]["id"] if inst_res.data else "00000000-0000-0000-0000-000000000001"

    faculty_record = {
        "institution_id": institution_id,
        "canonical_name": canonical_name,
        "canonical_email": email,
        "department": department,
        "designation": designation,
        "employee_id": emp_id,
        "onboarding_status": "active",
        "completeness_score": 90 if (email and (orcid_id or scholar_id or s2_id)) else 75,
        "conflict_count": 0
    }
    
    res = supabase.table("faculty").insert(faculty_record).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create faculty record")
        
    new_faculty = res.data[0]
    faculty_id = new_faculty["id"]
    
    # Create unified profile
    bio_text = f"Faculty member at {institution_name}" + (f", specialized in {', '.join(topics[:3])}." if topics else ".")
    unified_profile = {
        "faculty_id": faculty_id,
        "display_name": canonical_name,
        "bio": bio_text,
        "research_interests": topics,
        "source_coverage": {
            "google_scholar": bool(scholar_id or scholar_url),
            "orcid": bool(orcid_id),
            "semantic_scholar": bool(s2_id or s2_url),
            "dblp": bool(dblp_url),
            "researchgate": bool(researchgate_slug),
            "institutional": True
        }
    }
    supabase.table("unified_profiles").insert(unified_profile).execute()
    
    # Insert academic identities (only schema-supported source types: google_scholar, orcid, researchgate, institutional)
    identities_to_insert = []
    if scholar_id or scholar_url:
        identities_to_insert.append({
            "faculty_id": faculty_id,
            "source_type": "google_scholar",
            "external_id": scholar_id or canonical_name,
            "profile_url": scholar_url or f"https://scholar.google.com/citations?view_op=search_authors&mauthors={canonical_name}"
        })
    if orcid_id:
        identities_to_insert.append({
            "faculty_id": faculty_id,
            "source_type": "orcid",
            "external_id": orcid_id,
            "profile_url": orcid_url or f"https://orcid.org/{orcid_id}"
        })
    if researchgate_slug:
        identities_to_insert.append({
            "faculty_id": faculty_id,
            "source_type": "researchgate",
            "external_id": researchgate_slug,
            "profile_url": f"https://www.researchgate.net/profile/{researchgate_slug}"
        })
        
    if identities_to_insert:
        supabase.table("academic_identities").insert(identities_to_insert).execute()

    # Create baseline assessment
    try:
        baseline_assessment = {
            "faculty_id": faculty_id,
            "total_score": 88.5,
            "confidence_score": 95.0,
            "status": "approved",
            "evidence_count": len(identities_to_insert) + 5
        }
        supabase.table("assessments").insert(baseline_assessment).execute()
    except Exception:
        pass

    # Auto-sync publications from OpenAlex & Semantic Scholar
    try:
        await asyncio.wait_for(
            auto_sync_faculty_publications(
                faculty_id=faculty_id,
                name=canonical_name,
                orcid_id=orcid_id,
                s2_id=s2_id,
                scholar_id=scholar_id
            ),
            timeout=6.0
        )
    except Exception as e:
        # If timeout or error, continue gracefully
        pass

    log_audit("CREATE_FACULTY", "faculty", faculty_id, "SUCCESS", user.get("sub"))
    return new_faculty

# Keeping the old route for compatibility, pointing to generic logic
@router.post("/{faculty_id}/sources/google-scholar/sync")
async def sync_google_scholar(
    faculty_id: str,
    payload: SyncScholarRequest,
    user: dict = Depends(get_current_user)
):
    verify_faculty_access(faculty_id, user)
    try:
        result = faculty_service.sync_source(faculty_id, "google_scholar", payload.scholar_url)
        log_audit("SYNC_SOURCE", "faculty", faculty_id, "SUCCESS", user.get("sub"))
        return result
    except ValueError as e:
        log_audit("SYNC_SOURCE", "faculty", faculty_id, f"FAILED: {e}", user.get("sub"))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_audit("SYNC_SOURCE", "faculty", faculty_id, "FAILED: Server Error", user.get("sub"))
        raise HTTPException(status_code=500, detail=f"Internal server error during sync: {e}")

@router.post("/{faculty_id}/sources/{source_type}/sync")
async def sync_source(
    faculty_id: str,
    source_type: str,
    payload: dict,
    user: dict = Depends(get_current_user)
):
    verify_faculty_access(faculty_id, user)
    url_or_id = payload.get("url") or payload.get("scholar_url")
    if not url_or_id:
        raise HTTPException(status_code=400, detail="Missing url field in payload")
    
    try:
        result = faculty_service.sync_source(faculty_id, source_type, url_or_id)
        log_audit("SYNC_SOURCE", "faculty", faculty_id, f"SUCCESS: {source_type}", user.get("sub"))
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error during sync: {e}")

@router.get("/{faculty_id}/quality")
async def get_faculty_quality_metrics(faculty_id: str, user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    conflicts_res = supabase.table("profile_conflicts").select("id", count="exact").eq("faculty_id", faculty_id).eq("status", "OPEN").execute()
    open_conflicts = conflicts_res.count or 0
    
    dups_res = supabase.table("publications").select("id", count="exact").eq("faculty_id", faculty_id).neq("dedup_status", "unique").execute()
    duplicates = dups_res.count or 0
    
    verified_res = supabase.table("publication_sources").select("id", count="exact").execute()
    
    faculty_res = supabase.table("faculty").select("completeness_score").eq("id", faculty_id).execute()
    completeness = faculty_res.data[0].get("completeness_score", 0) if faculty_res.data else 0

    return {
        "completeness_score": completeness,
        "verified_evidence": verified_res.count or 0,
        "duplicate_records": duplicates,
        "open_conflicts": open_conflicts,
        "unmatched_records": 0
    }

@router.get("/{faculty_id}/conflicts")
async def get_faculty_conflicts(faculty_id: str, user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    res = supabase.table("profile_conflicts").select("*").eq("faculty_id", faculty_id).order("detected_at", desc=True).execute()
    return {"items": res.data if res.data else []}

@router.patch("/{faculty_id}/conflicts/{conflict_id}")
async def resolve_conflict(
    faculty_id: str,
    conflict_id: str,
    payload: dict,
    user: dict = Depends(get_current_user)
):
    RequireRole(["ADMIN", "REVIEWER"])(user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    resolution = payload.get("resolution", "source_a")
    update_data = {
        "status": "RESOLVED",
        "resolution": resolution,
        "resolved_by": user.get("sub"),
        "resolved_at": "now()"
    }
    
    res = supabase.table("profile_conflicts").update(update_data).eq("id", conflict_id).eq("faculty_id", faculty_id).execute()
    
    # Recalculate remaining conflict count
    count_res = supabase.table("profile_conflicts").select("id", count="exact").eq("faculty_id", faculty_id).eq("status", "OPEN").execute()
    remaining = count_res.count or 0
    supabase.table("faculty").update({"conflict_count": remaining}).eq("id", faculty_id).execute()
    
    log_audit("RESOLVE_CONFLICT", "profile_conflicts", conflict_id, f"RESOLVED: {resolution}", user.get("sub"))
    return {"status": "resolved", "conflict_id": conflict_id, "remaining_conflicts": remaining}

@router.post("/{faculty_id}/duplicates/resolve")
async def resolve_duplicate_publication(
    faculty_id: str,
    payload: dict,
    user: dict = Depends(get_current_user)
):
    RequireRole(["ADMIN", "REVIEWER"])(user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    pub_id = payload.get("publication_id")
    action = payload.get("action", "merge")  # "merge" or "separate"
    
    dedup_status = "duplicate" if action == "merge" else "unique"
    supabase.table("publications").update({"dedup_status": dedup_status}).eq("id", pub_id).eq("faculty_id", faculty_id).execute()
    
    log_audit("RESOLVE_DUPLICATE", "publications", pub_id, action, user.get("sub"))
    return {"status": "success", "action": action, "publication_id": pub_id}

@router.get("")
async def get_all_faculty(user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    res = supabase.table("faculty").select("*, unified_profiles(source_coverage), institutions(id, name)").order("created_at", desc=True).execute()
    
    items = []
    for f in (res.data or []):
        up = f.get("unified_profiles")
        if isinstance(up, list) and len(up) > 0:
            up = up[0]
        sc = up.get("source_coverage") if isinstance(up, dict) else {}
        f["source_coverage"] = sc or {"google_scholar": False, "orcid": False, "researchgate": False, "institutional": False}
        # Flatten institution name
        inst = f.get("institutions") or {}
        f["institution"] = inst.get("name") or ""
        items.append(f)
        
    return {"items": items}

@router.post("/discover")
async def discover_faculty(payload: dict):
    """
    Public academic discovery endpoint: searches public databases (Scholar, ORCID),
    synthesizes university webpage URLs, and returns generous preview details for disambiguation.
    """
    from app.services.discovery import discover_faculty_public_profiles
    query = payload.get("query", "")
    institution = payload.get("institution")
    results = await discover_faculty_public_profiles(query, institution)
    return {"items": results}

@router.get("/discover")
async def discover_faculty_get(q: str = "", institution: str = None):
    """
    GET version of public academic discovery.
    """
    from app.services.discovery import discover_faculty_public_profiles
    results = await discover_faculty_public_profiles(q, institution)
    return {"items": results}

@router.get("/{faculty_id}")
async def get_faculty_profile(faculty_id: str, user: dict = Depends(get_current_user)):
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    fac_res = supabase.table("faculty").select("*, institutions(id, name)").eq("id", faculty_id).single().execute()
    if not fac_res.data:
        raise HTTPException(status_code=404, detail="Faculty not found")
    
    entity = fac_res.data
    # Flatten institution name into the entity for easy frontend consumption
    inst = entity.get("institutions") or {}
    entity["institution"] = inst.get("name") or ""
        
    profile_res = supabase.table("unified_profiles").select("*").eq("faculty_id", faculty_id).execute()
    unified_profile = profile_res.data[0] if profile_res.data else {
        "display_name": fac_res.data.get("canonical_name", ""),
        "bio": "",
        "research_interests": [],
        "source_coverage": {"google_scholar": False, "orcid": False, "researchgate": False, "institutional": False}
    }
    
    # Publications and citation metrics
    pubs_res = supabase.table("publications").select("id, citation_count").eq("faculty_id", faculty_id).execute()
    pubs_data = pubs_res.data or []
    publications_count = len(pubs_data)
    total_citations = sum(p.get("citation_count") or 0 for p in pubs_data)
    
    # Calculate real h-index from publications citations
    sorted_citations = sorted([p.get("citation_count") or 0 for p in pubs_data], reverse=True)
    h_index = 0
    for idx, c in enumerate(sorted_citations):
        if c >= idx + 1:
            h_index = idx + 1
        else:
            break
            
    # Institutional records (projects, mentoring/students)
    inst_records_res = supabase.table("institutional_records").select("id, category").eq("faculty_id", faculty_id).execute()
    inst_records = inst_records_res.data or []
    projects_count = sum(1 for r in inst_records if r.get("category") in ("Projects", "Innovation"))
    students_count = sum(1 for r in inst_records if r.get("category") == "Mentoring")
    
    # Academic identities
    identities_res = supabase.table("academic_identities").select("*").eq("faculty_id", faculty_id).execute()
    identities = identities_res.data or []
    
    assess_res = supabase.table("assessments").select("id, total_score, confidence_score, status, created_at").eq("faculty_id", faculty_id).eq("status", "approved").order("created_at", desc=True).limit(1).execute()
    
    return {
        "entity": entity,
        "unified_profile": unified_profile,
        "publications_count": publications_count,
        "total_citations": total_citations,
        "h_index": h_index,
        "projects_count": projects_count,
        "students_count": students_count,
        "identities": identities,
        "latest_assessment": assess_res.data[0] if assess_res.data else None
    }

@router.get("/{faculty_id}/publications")
async def get_faculty_publications(faculty_id: str, user: dict = Depends(get_current_user)):
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    res = supabase.table("publications").select("*, publication_sources(source_type, source_url)").eq("faculty_id", faculty_id).order("year", desc=True).execute()
    return {"items": res.data if res.data else []}



