from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user, verify_faculty_access, log_audit
from app.schemas.faculty import SyncScholarRequest
from app.services import faculty_service

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

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
        raise HTTPException(status_code=500, detail="Internal server error during sync")

@router.post("/{faculty_id}/sources/{source_type}/sync")
async def sync_source(
    faculty_id: str,
    source_type: str,
    payload: dict,
    user: dict = Depends(get_current_user)
):
    verify_faculty_access(faculty_id, user)
    url_or_id = payload.get("url")
    if not url_or_id:
        raise HTTPException(status_code=400, detail="Missing url field in payload")
    
    try:
        result = faculty_service.sync_source(faculty_id, source_type, url_or_id)
        log_audit("SYNC_SOURCE", "faculty", faculty_id, f"SUCCESS: {source_type}", user.get("sub"))
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during sync")

@router.get("/{faculty_id}/quality")
async def get_faculty_quality_metrics(faculty_id: str, user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    # Conflicts
    conflicts_res = supabase.table("profile_conflicts").select("id", count="exact").eq("faculty_id", faculty_id).eq("status", "OPEN").execute()
    open_conflicts = conflicts_res.count or 0
    
    # Duplicates / Candidates
    dups_res = supabase.table("publications").select("id", count="exact").eq("faculty_id", faculty_id).neq("dedup_status", "unique").execute()
    duplicates = dups_res.count or 0
    
    # Verified Evidence (sources)
    verified_res = supabase.table("publication_sources").select("id", count="exact").execute() # simplistic
    
    # Profile completeness
    faculty_res = supabase.table("faculty").select("completeness_score").eq("id", faculty_id).execute()
    completeness = faculty_res.data[0].get("completeness_score", 0) if faculty_res.data else 0

    return {
        "completeness_score": completeness,
        "verified_evidence": verified_res.count or 0,
        "duplicate_records": duplicates,
        "open_conflicts": open_conflicts,
        "unmatched_records": 0  # Global to institution, or we can query by email
    }

@router.get("/{faculty_id}/conflicts")
async def get_faculty_conflicts(faculty_id: str, user: dict = Depends(get_current_user)):
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    
    res = supabase.table("profile_conflicts").select("*").eq("faculty_id", faculty_id).order("detected_at", desc=True).execute()
    return {"items": res.data}

@router.get("")
async def get_all_faculty(user: dict = Depends(get_current_user)):
    from app.core.auth import RequireRole
    RequireRole(["ADMIN", "REVIEWER"])(user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    res = supabase.table("faculty").select("*").execute()
    return {"items": res.data if res.data else []}

@router.get("/{faculty_id}")
async def get_faculty_profile(faculty_id: str, user: dict = Depends(get_current_user)):
    verify_faculty_access(faculty_id, user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    res = supabase.table("faculty").select("*").eq("id", faculty_id).single().execute()
    return res.data

@router.get("/{faculty_id}/publications")
async def get_faculty_publications(faculty_id: str, user: dict = Depends(get_current_user)):
    verify_faculty_access(faculty_id, user)
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()
    res = supabase.table("publications").select("*, publication_sources(source_type, source_url)").eq("faculty_id", faculty_id).order("year", desc=True).execute()
    return {"items": res.data if res.data else []}
