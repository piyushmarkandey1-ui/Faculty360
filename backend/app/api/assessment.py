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
    res = supabase.table("assessments").select("*, kpi_scores(*)").eq("faculty_id", faculty_id).in_("status", ["approved", "archived"]).order("created_at", desc=True).limit(10).execute()
    
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

@router.post("/api/faculty/{faculty_id}/assessment/calculate")
async def calculate_faculty_assessment(faculty_id: str, user: dict = Depends(get_current_user)):
    validate_faculty_id(faculty_id)
    verify_faculty_access(faculty_id, user)
    try:
        result = calculate_assessment(faculty_id)
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
        raise HTTPException(status_code=503, detail=str(e))
@router.get("/api/assessments")
async def list_assessments(user: dict = Depends(get_current_user)):
    from app.core.auth import RequireRole
    RequireRole(["ADMIN", "REVIEWER"])(user)
    supabase = get_supabase_admin()
    
    # We want a summary of assessments combined with faculty info
    res = supabase.table("assessments").select("*, faculty(id, canonical_name, department, designation, completeness_score)").order("created_at", desc=True).execute()
    return {"items": res.data if res.data else []}
