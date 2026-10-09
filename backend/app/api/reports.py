from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from app.core.auth import get_current_user
from app.core.tiger import execute_query
import csv
import io

router = APIRouter(tags=["reports"])

@router.get("/api/reports/faculty")
async def export_faculty_report(user: dict = Depends(get_current_user)):
    user_id = user.get("sub") or "00000000-0000-0000-0000-000000000000"
    is_demo = (user_id == "00000000-0000-0000-0000-000000000000" or user.get("email") in ("admin@acadlens.ac.in", "admin@acadlens.local"))

    if is_demo:
        where_clause = "WHERE (f.created_by IS NULL OR f.created_by = '00000000-0000-0000-0000-000000000000')"
        params = ()
    else:
        where_clause = "WHERE f.created_by = %s"
        params = (user_id,)

    sql = f"""
    SELECT f.id, f.canonical_name, f.department, f.completeness_score, a.total_score as assessment_score
    FROM faculty f
    LEFT JOIN assessments a ON f.id = a.faculty_id AND a.status = 'approved'
    {where_clause}
    ORDER BY f.created_at DESC;
    """
    rows = execute_query(sql, params)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Faculty ID", "Name", "Department", "Profile Completeness", "Assessment Score"])

    for f in rows:
        writer.writerow([
            f["id"], 
            f["canonical_name"], 
            f["department"], 
            f.get("completeness_score", 0), 
            f.get("assessment_score") or "N/A"
        ])
        
    return PlainTextResponse(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=faculty_report.csv"})
