import asyncio
import os
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.config import settings
from app.core.supabase import get_supabase_admin
from app.api.assessment import get_framework, calculate_faculty_assessment

async def run_e2e():
    print("--- LIVE E2E TEST ---")
    supabase = get_supabase_admin()
    
    print("1. Verifying institutional_records...")
    try:
        supabase.table("institutional_records").select("*").limit(1).execute()
        print("   SUCCESS")
    except Exception as e:
        print("   FAILED:", e)
        
    print("2. Verifying assessment_frameworks...")
    try:
        supabase.table("assessment_frameworks").select("*").limit(1).execute()
        print("   SUCCESS")
    except Exception as e:
        print("   FAILED:", e)

    print("3. Testing Assessment Framework Endpoint...")
    try:
        res = await get_framework(user={'sub': 'admin'})
        print("   SUCCESS")
    except Exception as e:
        print("   FAILED:", e)
        
run_e2e_sync = lambda: asyncio.run(run_e2e())
run_e2e_sync()
