from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user, verify_faculty_access, log_audit
from app.services.assessment_engine import calculate_assessment, get_active_framework
from app.core.supabase import get_supabase_admin

router = APIRouter(tags=["assessment"])

@router.get("/api/assessment/framework")
async def get_framework(user: dict = Depends(get_current_user)):
    try:
        return get_active_framework()
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/faculty/{faculty_id}/assessment")
async def get_assessment(faculty_id: str, user: dict = Depends(get_current_user)):
    verify_faculty_access(faculty_id, user)
    supabase = get_supabase_admin()
    res = supabase.table("assessments").select("*, kpi_scores(*)").eq("faculty_id", faculty_id).eq("status", "approved").order("created_at", desc=True).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No assessment found")
    return res.data[0]

@router.post("/api/faculty/{faculty_id}/assessment/calculate")
async def calculate_faculty_assessment(faculty_id: str, user: dict = Depends(get_current_user)):
    verify_faculty_access(faculty_id, user)
    try:
        result = calculate_assessment(faculty_id)
        log_audit("CALCULATE_ASSESSMENT", "faculty", faculty_id, "SUCCESS", user.get("sub"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/faculty/{faculty_id}/insights")
async def generate_insights(faculty_id: str, user: dict = Depends(get_current_user)):
    verify_faculty_access(faculty_id, user)
    from app.services.ai_insights import generate_faculty_insights
    try:
        insights = await generate_faculty_insights(faculty_id)
        log_audit("GENERATE_INSIGHTS", "faculty", faculty_id, "SUCCESS", user.get("sub"))
        return insights
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
@router.get("/api/assessments")
async def list_assessments(user: dict = Depends(get_current_user)):
    from app.core.auth import RequireRole
    RequireRole(["ADMIN", "REVIEWER"])(user)
    supabase = get_supabase_admin()
    
    # We want a summary of assessments combined with faculty info
    res = supabase.table("assessments").select("*, faculty(id, canonical_name, department, designation, completeness_score)").order("created_at", desc=True).execute()
    return {"items": res.data if res.data else []}
