import asyncio
import os
import sys
import traceback
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.config import settings
from app.core.supabase import get_supabase_admin
from app.services.faculty_service import process_institutional_batch
from app.services.assessment_engine import calculate_assessment
from app.api.assessment import get_assessment_history

async def run_e2e_full():
    print("--- LIVE SUPABASE E2E FULL VALIDATION ---")
    supabase = get_supabase_admin()
    
    res = supabase.table("faculty").select("*").limit(1).execute()
    if not res.data:
        print("No faculty found to run tests against.")
        return
    faculty_id = res.data[0]["id"]
    employee_id = res.data[0].get("employee_id") or "EMP001"
    email = res.data[0].get("canonical_email") or "test@test.com"
    
    print("\n[TEST] CSV Institutional Data Upload")
    try:
        csv_content = f"employee_id,email,category,title,year\n{employee_id},{email},outreach,Guest Lecture at MIT,2025\n{employee_id},{email},outreach,Community Science Fair,2025"
        res_outreach = process_institutional_batch(csv_content, category_override="outreach", dry_run=False)
        print("  Outreach Records Inserted:", res_outreach["recordsImported"])
        
        csv_content2 = f"employee_id,email,category,title,year\n{employee_id},{email},leadership,Department Chair,2025"
        res_leadership = process_institutional_batch(csv_content2, category_override="leadership", dry_run=False)
        print("  Academic Leadership Records Inserted:", res_leadership["recordsImported"])
    except Exception as e:
        traceback.print_exc()
        
    print("\n[TEST] Assessment Calculation")
    try:
        assessment_res = calculate_assessment(faculty_id)
        print("  Assessment ID:", assessment_res["assessment_id"])
        print("  Overall Score:", assessment_res["overallScore"])
        print("  Category Scores:", assessment_res["categoryScores"])
    except Exception as e:
        traceback.print_exc()
        
    print("\n[TEST] Historical Trends API")
    try:
        hist_res = await get_assessment_history(faculty_id, user={'sub': 'admin', 'role': 'ADMIN'})
        print("  Historical Records Returned:", len(hist_res["items"]))
        print("  Is Demo Data:", hist_res["is_demo"])
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_e2e_full())
