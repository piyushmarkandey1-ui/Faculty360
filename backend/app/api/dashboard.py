from fastapi import APIRouter, Depends
from app.core.auth import get_current_user, RequireRole
from app.core.supabase import get_supabase_admin

router = APIRouter(tags=["dashboard"])

@router.get("/api/dashboard/summary")
async def get_dashboard_summary(user: dict = Depends(RequireRole(["ADMIN", "REVIEWER"]))):
    supabase = get_supabase_admin()
    
    fac_res = supabase.table("faculty").select("id, canonical_name, department, completeness_score, onboarding_status").execute()
    faculty_list = fac_res.data if fac_res.data else []
    faculty_count = len(faculty_list)
    completed_profiles = len([f for f in faculty_list if f.get("completeness_score", 0) > 80])
    
    assess_res = supabase.table("assessments").select("total_score").eq("status", "approved").execute()
    total_assessments = len(assess_res.data) if assess_res.data else 0
    avg_score = sum([a["total_score"] for a in assess_res.data]) / total_assessments if total_assessments > 0 else 0
    
    conflicts_res = supabase.table("profile_conflicts").select("id", count="exact").eq("status", "OPEN").execute()
    open_conflicts = conflicts_res.count or 0
    
    # Evidence completeness roughly
    kpi_res = supabase.table("kpi_scores").select("status, category").execute()
    valid_kpis = len([k for k in kpi_res.data if k["status"] == "VALID"]) if kpi_res.data else 0
    total_kpis = len(kpi_res.data) if kpi_res.data else 0
    evidence_completeness = (valid_kpis / total_kpis * 100) if total_kpis > 0 else 0
    
    # Category performance
    cat_performance = {}
    if kpi_res.data:
        cat_scores = {}
        for k in kpi_res.data:
            cat = k["category"]
            if cat not in cat_scores:
                cat_scores[cat] = {"score": 0, "count": 0}
            cat_scores[cat]["score"] += k.get("computed_score", 0)
            cat_scores[cat]["count"] += 1
            
        for cat, data in cat_scores.items():
            cat_performance[cat] = data["score"] / data["count"]
            
    recent_faculty = faculty_list[:8]
            
    return {
        "totalFaculty": faculty_count,
        "completedProfiles": completed_profiles,
        "averageAssessmentScore": round(avg_score, 1),
        "evidenceCompleteness": round(evidence_completeness, 1),
        "openConflicts": open_conflicts,
        "categoryPerformance": cat_performance,
        "recentFaculty": recent_faculty
    }
