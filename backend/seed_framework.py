import json
import asyncio
from app.core.supabase import get_supabase_admin

async def seed():
    supabase = get_supabase_admin()
    
    config = {
        "categories": [
            {
                "id": "research",
                "name": "Research",
                "weight": 0.40,
                "parameters": [
                    {
                        "id": "res_publications",
                        "name": "Publication Volume",
                        "weight": 0.4,
                        "max_score": 100,
                        "rule": "count * 10",
                        "evidence_requirement": "publications"
                    },
                    {
                        "id": "res_citations",
                        "name": "Citation Impact",
                        "weight": 0.3,
                        "max_score": 100,
                        "rule": "min(citations / 10, 100)",
                        "evidence_requirement": "academic_identities.citations"
                    },
                    {
                        "id": "res_hindex",
                        "name": "H-Index",
                        "weight": 0.3,
                        "max_score": 100,
                        "rule": "min(h_index * 5, 100)",
                        "evidence_requirement": "academic_identities.h_index"
                    }
                ]
            },
            {
                "id": "teaching",
                "name": "Teaching",
                "weight": 0.20,
                "parameters": [
                    {
                        "id": "teach_courses",
                        "name": "Courses Taught",
                        "weight": 1.0,
                        "max_score": 100,
                        "rule": "count * 20",
                        "evidence_requirement": "institutional_records.Teaching"
                    }
                ]
            },
            {
                "id": "mentoring",
                "name": "Mentoring",
                "weight": 0.10,
                "parameters": [
                    {
                        "id": "mentor_students",
                        "name": "Students Mentored",
                        "weight": 1.0,
                        "max_score": 100,
                        "rule": "count * 25",
                        "evidence_requirement": "institutional_records.Mentoring"
                    }
                ]
            },
            {
                "id": "institutional_service",
                "name": "Institutional Service",
                "weight": 0.10,
                "parameters": [
                    {
                        "id": "service_committees",
                        "name": "Committee Memberships",
                        "weight": 1.0,
                        "max_score": 100,
                        "rule": "count * 20",
                        "evidence_requirement": "institutional_records.Institutional Service"
                    }
                ]
            },
            {
                "id": "innovation",
                "name": "Innovation",
                "weight": 0.10,
                "parameters": [
                    {
                        "id": "innov_projects",
                        "name": "Patents & Projects",
                        "weight": 1.0,
                        "max_score": 100,
                        "rule": "count * 50",
                        "evidence_requirement": "institutional_records.Innovation"
                    }
                ]
            },
            {
                "id": "outreach",
                "name": "Outreach",
                "weight": 0.05,
                "parameters": [
                    {
                        "id": "outreach_events",
                        "name": "Public Outreach",
                        "weight": 1.0,
                        "max_score": 100,
                        "rule": "count * 20",
                        "evidence_requirement": "institutional_records.Outreach"
                    }
                ]
            },
            {
                "id": "academic_leadership",
                "name": "Academic Leadership",
                "weight": 0.05,
                "parameters": [
                    {
                        "id": "lead_roles",
                        "name": "Leadership Roles",
                        "weight": 1.0,
                        "max_score": 100,
                        "rule": "count * 50",
                        "evidence_requirement": "institutional_records.Awards"
                    }
                ]
            }
        ]
    }
    
    # Check if active exists
    res = supabase.table("assessment_frameworks").select("id").eq("status", "active").execute()
    if not res.data:
        supabase.table("assessment_frameworks").insert({
            "name": "AcadLens Core Framework",
            "version": "1.0.0",
            "status": "active",
            "config": config
        }).execute()
        print("Framework seeded.")
    else:
        # Update it just in case
        supabase.table("assessment_frameworks").update({
            "config": config
        }).eq("id", res.data[0]["id"]).execute()
        print("Framework updated.")

if __name__ == "__main__":
    asyncio.run(seed())
