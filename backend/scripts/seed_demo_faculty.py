import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from app.core.supabase import get_supabase_admin

def seed():
    supabase = get_supabase_admin()
    
    faculty_id = "00000000-0000-0000-0000-000000000001"
    
    print("Deleting existing demo faculty...")
    supabase.table("faculty").delete().eq("id", faculty_id).execute()
    
    # Get institution id
    inst_res = supabase.table("institutions").select("id").limit(1).execute()
    inst_id = inst_res.data[0]["id"] if inst_res.data else None
    
    print("Inserting fresh demo faculty...")
    supabase.table("faculty").insert({
        "id": faculty_id,
        "institution_id": inst_id,
        "canonical_name": "Dr. Rajesh Kumar Sharma",
        "department": "Computer Science & Engineering",
        "designation": "Associate Professor",
        "canonical_email": "r.sharma@nitw.ac.in",
        "onboarding_status": "active",
        "completeness_score": 75
    }).execute()
    
    print("\nSUCCESS! Demo faculty seeded directly into your live Supabase DB!")
    print("Faculty ID:", faculty_id)
    print("Faculty Name: Dr. Rajesh Kumar Sharma")

if __name__ == "__main__":
    seed()