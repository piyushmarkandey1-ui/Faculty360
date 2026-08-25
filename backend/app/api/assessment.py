from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
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
    supabase = get_supabase_admin()
    res = supabase.table("assessments").select("*, kpi_scores(*)").eq("faculty_id", faculty_id).eq("status", "approved").order("created_at", desc=True).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No assessment found")
    return res.data[0]

@router.post("/api/faculty/{faculty_id}/assessment/calculate")
async def calculate_faculty_assessment(faculty_id: str, user: dict = Depends(get_current_user)):
    try:
        return calculate_assessment(faculty_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
