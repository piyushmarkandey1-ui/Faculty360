import logging
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user, verify_faculty_access, log_audit
from app.services.assessment_engine import calculate_assessment, get_active_framework
from app.core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["assessment"])

@router.get("/api/assessment/framework")
async def get_framework(user: dict = Depends(get_current_user)):
    try:
        return get_active_framework()
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/assessment/frameworks")
async def list_active_frameworks(user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    res = supabase.table("assessment_frameworks").select("*").eq("status", "active").order("created_at", desc=True).execute()
    return {"items": res.data if res.data else []}

@router.post("/api/assessment/framework/suggest")
async def suggest_framework_improvements(payload: dict, user: dict = Depends(get_current_user)):
    from app.core.auth import RequireRole
    from app.services.ai_insights import generate_framework_suggestions
    RequireRole(["ADMIN", "DEAN", "REVIEWER"])(user)
    try:
        suggestions = await generate_framework_suggestions(payload)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/assessment/framework")
async def publish_framework(payload: dict, user: dict = Depends(get_current_user)):
    from app.core.auth import RequireRole
    RequireRole(["ADMIN"])(user)
    try:
        # Validate weights
        total_weight = sum(c.get("weight", 0) for c in payload.get("categories", []))
        if abs(total_weight - 1.0) > 0.01:
            raise ValueError(f"Category weights must sum to 1.0, got {total_weight}")
            
        supabase = get_supabase_admin()
        
        # Archive old active framework
        current_res = supabase.table("assessment_frameworks").select("*").eq("status", "active").execute()
        if current_res.data:
            current_id = current_res.data[0]["id"]
            current_version = current_res.data[0]["version"]
            supabase.table("assessment_frameworks").update({"status": "archived"}).eq("id", current_id).execute()
            
            # Increment version safely (e.g. 1.0.0 -> 1.0.1)
            parts = current_version.split(".")
            if len(parts) == 3:
                parts[2] = str(int(parts[2]) + 1)
                new_version = ".".join(parts)
            else:
                new_version = f"{current_version}.1"
        else:
            new_version = "1.0.0"
            
        new_fw = supabase.table("assessment_frameworks").insert({
            "name": "Custom Framework",
            "version": new_version,
            "status": "active",
            "config": payload
        }).execute()
        return new_fw.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def validate_faculty_id(faculty_id: str):
    if not faculty_id or str(faculty_id).strip().lower() in ("undefined", "null", "none", ""):
        raise HTTPException(status_code=400, detail="Invalid faculty ID")

@router.get("/api/faculty/{faculty_id}/assessment")
async def get_assessment(faculty_id: str, user: dict = Depends(get_current_user)):
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    supabase = get_supabase_admin()
    res = supabase.table("assessments").select("*, kpi_scores(*)").eq("faculty_id", faculty_id).eq("status", "approved").order("created_at", desc=True).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No assessment found")
    return res.data[0]

@router.get("/api/faculty/{faculty_id}/assessment/history")
async def get_assessment_history(faculty_id: str, user: dict = Depends(get_current_user)):
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    supabase = get_supabase_admin()
    res = supabase.table("assessments").select("*, kpi_scores(*), assessment_frameworks(name, version)").eq("faculty_id", faculty_id).in_("status", ["approved", "archived"]).order("created_at", desc=True).limit(10).execute()
    
    if not res.data or len(res.data) < 2:
        # Provide demo data if insufficient historical data exists
        from datetime import datetime, timedelta
        now = datetime.now()
        base_score = res.data[0]["total_score"] if res.data else 65.0
        
        demo_history = []
        # Generate 4 historical points spanning back 4 years
        for i in range(4, -1, -1):
            demo_history.append({
                "id": f"demo-hist-{i}",
                "total_score": round(base_score - (i * 3.5) + (i % 2), 2),
                "created_at": (now - timedelta(days=365 * i)).isoformat(),
                "status": "archived" if i > 0 else "approved",
                "is_demo": True,
                "kpi_scores": [
                    {"category": "Research", "computed_score": 30.0 - i},
                    {"category": "Teaching", "computed_score": 15.0 - (i*0.5)},
                    {"category": "Mentoring", "computed_score": 8.0},
                    {"category": "Outreach", "computed_score": 3.0 + i},
                    {"category": "Academic Leadership", "computed_score": 4.0}
                ]
            })
        return {"items": demo_history, "is_demo": True}
        
    return {"items": res.data, "is_demo": False}

@router.post("/api/assessment/gather-all")
async def gather_all_assessment_data_endpoint(user: dict = Depends(get_current_user)):
    """
    Pre-gather all 7 assessment parameter data across all profiles before evaluation,
    including teaching, mentoring, service, innovation, outreach, leadership, and custom framework parameters.
    """
    from app.core.auth import RequireRole
    from app.services.auto_ingest import sync_smart_faculty_profile
    RequireRole(["ADMIN", "REVIEWER", "DEAN"])(user)
    supabase = get_supabase_admin()
    
    fac_res = supabase.table("faculty").select("id, canonical_name, department, institutions(name)").execute()
    synced_count = 0
    results = []
    
    for fac in (fac_res.data or []):
        fac_id = fac["id"]
        name = fac.get("canonical_name", "Faculty Member")
        inst_name = (fac.get("institutions") or {}).get("name") if isinstance(fac.get("institutions"), dict) else "National Institute of Technology Raipur"
        dept = fac.get("department", "Computer Science & Engineering")
        try:
            await sync_smart_faculty_profile(fac_id, name, inst_name, dept)
            calculate_assessment(fac_id)
            synced_count += 1
            results.append({"id": fac_id, "name": name, "status": "synced"})
        except Exception as e:
            logger.warning(f"Batch sync error for {name}: {e}")
            results.append({"id": fac_id, "name": name, "status": "failed", "error": str(e)})
            
    log_audit("GATHER_ALL_ASSESSMENT_DATA", "assessment", "all", f"Synced {synced_count} profiles", user.get("sub"))
    return {
        "success": True,
        "message": f"Successfully pre-gathered assessment data across all 7 parameters for {synced_count} faculty profiles",
        "synced_count": synced_count,
        "items": results
    }

@router.post("/api/faculty/{faculty_id}/assessment/calculate")
async def calculate_faculty_assessment(faculty_id: str, payload: dict = None, user: dict = Depends(get_current_user)):
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    supabase = get_supabase_admin()
    
    # Ensure profile has gathered multi-source coverage before calculating
    up_res = supabase.table("unified_profiles").select("source_coverage").eq("faculty_id", faculty_id).execute()
    needs_sync = True
    if up_res.data and up_res.data[0].get("source_coverage"):
        sc = up_res.data[0]["source_coverage"]
        if isinstance(sc, dict) and sc.get("teaching") and sc.get("experience"):
            needs_sync = False
            
    if needs_sync:
        try:
            from app.services.auto_ingest import sync_smart_faculty_profile
            fac_res = supabase.table("faculty").select("canonical_name, department, institutions(name)").eq("id", faculty_id).execute()
            if fac_res.data:
                fac = fac_res.data[0]
                name = fac.get("canonical_name", "Faculty Member")
                inst_name = (fac.get("institutions") or {}).get("name") if isinstance(fac.get("institutions"), dict) else "National Institute of Technology Raipur"
                dept = fac.get("department", "Computer Science & Engineering")
                await sync_smart_faculty_profile(faculty_id, name, inst_name, dept)
        except Exception as e:
            logger.warning(f"Pre-assessment gather warning for {faculty_id}: {e}")

    try:
        framework_id = payload.get("framework_id") if payload else None
        result = calculate_assessment(faculty_id, framework_id)
        log_audit("CALCULATE_ASSESSMENT", "faculty", faculty_id, "SUCCESS", user.get("sub"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/faculty/{faculty_id}/insights")
async def generate_insights(faculty_id: str, user: dict = Depends(get_current_user)):
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    from app.services.ai_insights import generate_faculty_insights
    try:
        insights = await generate_faculty_insights(faculty_id)
        log_audit("GENERATE_INSIGHTS", "faculty", faculty_id, "SUCCESS", user.get("sub"))
        return insights
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail="AI insights temporarily unavailable.")

@router.get("/api/faculty/{faculty_id}/insights")
async def get_cached_insights(faculty_id: str, user: dict = Depends(get_current_user)):
    """Return cached AI insights from the latest approved assessment. Returns {} if not yet generated."""
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    supabase = get_supabase_admin()
    res = (
        supabase.table("assessments")
        .select("ai_insights")
        .eq("faculty_id", faculty_id)
        .eq("status", "approved")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return {}
    return res.data[0].get("ai_insights") or {}

@router.post("/api/faculty/{faculty_id}/overview")
async def generate_overview(faculty_id: str, user: dict = Depends(get_current_user)):
    """Generate a short Gemini overview for the Faculty Profile page."""
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    from app.services.ai_insights import generate_faculty_overview
    try:
        result = await generate_faculty_overview(faculty_id)
        log_audit("GENERATE_OVERVIEW", "faculty", faculty_id, "SUCCESS", user.get("sub"))
        return result
    except Exception as e:
        logger.error(f"Overview generation failed: {e}")
        raise HTTPException(status_code=503, detail="AI overview temporarily unavailable.")

@router.get("/api/assessments")
async def list_assessments(user: dict = Depends(get_current_user)):
    from app.core.auth import RequireRole
    RequireRole(["ADMIN", "REVIEWER"])(user)
    supabase = get_supabase_admin()
    
    # We want a summary of assessments combined with faculty info and framework info
    res = supabase.table("assessments").select("*, faculty(id, canonical_name, department, designation, completeness_score), assessment_frameworks(name, version)").order("created_at", desc=True).execute()
    return {"items": res.data if res.data else []}
