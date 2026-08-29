from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from app.core.auth import get_current_user, RequireRole
from app.core.supabase import get_supabase_admin
import csv
import io

router = APIRouter(tags=["reports"])

@router.get("/api/reports/faculty")
async def export_faculty_report(user: dict = Depends(RequireRole(["ADMIN", "REVIEWER"]))):
    supabase = get_supabase_admin()
    
    fac_res = supabase.table("faculty").select("id, canonical_name, department, completeness_score").execute()
    assess_res = supabase.table("assessments").select("faculty_id, total_score, status").eq("status", "approved").execute()
    
    assess_map = {a["faculty_id"]: a["total_score"] for a in assess_res.data} if assess_res.data else {}
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Faculty ID", "Name", "Department", "Profile Completeness", "Assessment Score"])
    
    for f in fac_res.data:
        writer.writerow([
            f["id"], 
            f["canonical_name"], 
            f["department"], 
            f.get("completeness_score", 0), 
            assess_map.get(f["id"], "N/A")
        ])
        
    return PlainTextResponse(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=faculty_report.csv"})
