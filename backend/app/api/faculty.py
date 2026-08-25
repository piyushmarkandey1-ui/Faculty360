from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
from app.core.auth import get_current_user, verify_faculty_access, log_audit, RequireRole
from app.schemas.faculty import SyncScholarRequest
from app.services import faculty_service

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

@router.post("")
async def create_faculty(payload: dict, user: dict = Depends(get_current_user)):
    RequireRole(["ADMIN"])(user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    canonical_name = payload.get("name") or payload.get("canonical_name")
    if not canonical_name:
        raise HTTPException(status_code=400, detail="Faculty name is required")
        
    department = payload.get("department", "General")
    designation = payload.get("designation", "Assistant Professor")
    email = payload.get("email") or payload.get("canonical_email")
    emp_id = payload.get("empId") or payload.get("employee_id")
    
    # Get institution_id from user or default to first institution
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
        "completeness_score": 60 if email else 40,
        "conflict_count": 0
    }
    
    res = supabase.table("faculty").insert(faculty_record).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create faculty record")
        
    new_faculty = res.data[0]
    faculty_id = new_faculty["id"]
    
    # Create unified profile
    unified_profile = {
        "faculty_id": faculty_id,
        "display_name": canonical_name,
        "source_coverage": {
            "google_scholar": bool(payload.get("scholarId")),
            "orcid": bool(payload.get("orcidId")),
            "researchgate": bool(payload.get("researchgateSlug")),
            "institutional": bool(emp_id)
        }
    }
    supabase.table("unified_profiles").insert(unified_profile).execute()
    
    # Insert academic identities if provided
    scholar_id = payload.get("scholarId")
    if scholar_id:
        supabase.table("academic_identities").insert({
            "faculty_id": faculty_id,
            "source_type": "google_scholar",
            "external_id": scholar_id,
            "profile_url": f"https://scholar.google.com/citations?user={scholar_id}"
        }).execute()
        
    orcid_id = payload.get("orcidId")
    if orcid_id:
        supabase.table("academic_identities").insert({
            "faculty_id": faculty_id,
            "source_type": "orcid",
            "external_id": orcid_id,
            "profile_url": f"https://orcid.org/{orcid_id}"
        }).execute()

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
    res = supabase.table("faculty").select("*, unified_profiles(source_coverage)").order("created_at", desc=True).execute()
    
    items = []
    for f in (res.data or []):
        up = f.get("unified_profiles") or {}
        sc = up.get("source_coverage") if isinstance(up, dict) else {}
        f["source_coverage"] = sc or {"google_scholar": False, "orcid": False, "researchgate": False, "institutional": False}
        items.append(f)
        
    return {"items": items}

@router.get("/{faculty_id}")
async def get_faculty_profile(faculty_id: str, user: dict = Depends(get_current_user)):
    verify_faculty_access(faculty_id, user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    fac_res = supabase.table("faculty").select("*").eq("id", faculty_id).single().execute()
    if not fac_res.data:
        raise HTTPException(status_code=404, detail="Faculty not found")
        
    profile_res = supabase.table("unified_profiles").select("*").eq("faculty_id", faculty_id).execute()
    unified_profile = profile_res.data[0] if profile_res.data else {
        "display_name": fac_res.data.get("canonical_name", ""),
        "bio": "",
        "research_interests": [],
        "source_coverage": {"google_scholar": False, "orcid": False, "researchgate": False, "institutional": False}
    }
    
    pubs_count_res = supabase.table("publications").select("id", count="exact").eq("faculty_id", faculty_id).execute()
    
    assess_res = supabase.table("assessments").select("id, total_score, completeness_score, confidence_score, status, assessed_at").eq("faculty_id", faculty_id).eq("status", "approved").order("created_at", desc=True).limit(1).execute()
    
    return {
        "entity": fac_res.data,
        "unified_profile": unified_profile,
        "publications_count": pubs_count_res.count or 0,
        "latest_assessment": assess_res.data[0] if assess_res.data else None
    }

@router.get("/{faculty_id}/publications")
async def get_faculty_publications(faculty_id: str, user: dict = Depends(get_current_user)):
    verify_faculty_access(faculty_id, user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    res = supabase.table("publications").select("*, publication_sources(source_type, source_url)").eq("faculty_id", faculty_id).order("year", desc=True).execute()
    return {"items": res.data if res.data else []}

