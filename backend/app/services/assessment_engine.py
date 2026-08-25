import logging
from typing import Dict, Any, List
from app.core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

DEFAULT_CONFIG = {
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

def get_active_framework():
    supabase = get_supabase_admin()
    res = supabase.table("assessment_frameworks").select("*").eq("status", "active").execute()
    if res.data:
        return res.data[0]
    
    # Lazy initialization if missing
    new_fw = supabase.table("assessment_frameworks").insert({
        "name": "AcadLens Core Framework",
        "version": "1.0.0",
        "status": "active",
        "config": DEFAULT_CONFIG
    }).execute()
    return new_fw.data[0]

def evaluate_rule(rule: str, data: Dict[str, Any]) -> float:
    """Safely evaluates a simple scoring rule."""
    count = data.get("count", 0)
    citations = data.get("citations", 0)
    h_index = data.get("h_index", 0)
    
    # Safe eval environment
    allowed_names = {
        "count": count,
        "citations": citations,
        "h_index": h_index,
        "min": min,
        "max": max
    }
    
    try:
        # pylint: disable=eval-used
        val = eval(rule, {"__builtins__": {}}, allowed_names)
        return float(val)
    except Exception as e:
        logger.error(f"Rule evaluation failed for {rule}: {e}")
        return 0.0

def calculate_assessment(faculty_id: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    framework = get_active_framework()
    config = framework["config"]
    
    # 1. Fetch all evidence
    pubs_res = supabase.table("publications").select("id").eq("faculty_id", faculty_id).eq("dedup_status", "unique").execute()
    pubs_count = len(pubs_res.data)
    
    idents_res = supabase.table("academic_identities").select("*").eq("faculty_id", faculty_id).execute()
    total_citations = sum([i.get("citations") or 0 for i in idents_res.data]) if idents_res.data else 0
    max_h_index = max([i.get("h_index") or 0 for i in idents_res.data]) if idents_res.data else 0
    
    inst_res = supabase.table("institutional_records").select("id, category").eq("faculty_id", faculty_id).execute()
    inst_records = inst_res.data or []
    
    evidence_map = {
        "publications": {"count": pubs_count, "refs": [p["id"] for p in pubs_res.data]},
        "academic_identities.citations": {"citations": total_citations, "refs": [i["id"] for i in idents_res.data]},
        "academic_identities.h_index": {"h_index": max_h_index, "refs": [i["id"] for i in idents_res.data]}
    }
    
    # Group institutional records
    for record in inst_records:
        cat = f"institutional_records.{record['category']}"
        if cat not in evidence_map:
            evidence_map[cat] = {"count": 0, "refs": []}
        evidence_map[cat]["count"] += 1
        evidence_map[cat]["refs"].append(record["id"])

    # 2. Calculate scores
    total_score = 0.0
    category_scores = {}
    parameter_scores = []
    evidence_count = 0
    missing_evidence_count = 0
    
    for category in config["categories"]:
        cat_score = 0.0
        
        for param in category["parameters"]:
            req = param["evidence_requirement"]
            evidence_data = evidence_map.get(req, {"count": 0, "citations": 0, "h_index": 0, "refs": []})
            
            # Check if evidence is sufficient (i.e. non-zero input)
            if evidence_data.get("count", 0) == 0 and evidence_data.get("citations", 0) == 0 and evidence_data.get("h_index", 0) == 0:
                missing_evidence_count += 1
                status = "INSUFFICIENT_EVIDENCE"
                raw_val = 0
                computed = 0
            else:
                evidence_count += len(evidence_data.get("refs", []))
                status = "VALID"
                raw_val = evidence_data.get("count") or evidence_data.get("citations") or evidence_data.get("h_index") or 0
                computed = evaluate_rule(param["rule"], evidence_data)
                computed = min(computed, param["max_score"])
            
            weighted_param_score = computed * param["weight"]
            cat_score += weighted_param_score
            
            parameter_scores.append({
                "rule_id": param["id"],
                "rule_name": param["name"],
                "category": category["name"],
                "raw_value": raw_val,
                "computed_score": computed,
                "max_score": param["max_score"],
                "status": status,
                "refs": evidence_data.get("refs", [])
            })
            
        # Apply category weight to overall score
        weighted_cat = cat_score * category["weight"]
        total_score += weighted_cat
        category_scores[category["name"]] = cat_score
        
    confidence = 100.0 if missing_evidence_count == 0 else max(100.0 - (missing_evidence_count * 15), 0.0)
    completeness = min(100.0, (evidence_count / max(1, (evidence_count + missing_evidence_count))) * 100.0)

    # 3. Save Assessment
    assessment_record = {
        "faculty_id": faculty_id,
        "framework_id": framework["id"],
        "total_score": round(total_score, 2),
        "completeness_score": round(completeness, 2),
        "confidence_score": round(confidence, 2),
        "status": "approved",
        "evidence_count": evidence_count,
        "missing_evidence_count": missing_evidence_count
    }
    
    # Deactivate old assessments
    supabase.table("assessments").update({"status": "archived"}).eq("faculty_id", faculty_id).execute()
    
    res = supabase.table("assessments").insert(assessment_record).execute()
    assessment_id = res.data[0]["id"]
    
    # Save KPI Scores and Evidence Refs
    kpi_inserts = []
    for p in parameter_scores:
        kpi_inserts.append({
            "assessment_id": assessment_id,
            "rule_id": p["rule_id"],
            "rule_name": p["rule_name"],
            "category": p["category"],
            "raw_value": p["raw_value"],
            "computed_score": round(p["computed_score"], 2),
            "max_score": p["max_score"],
            "status": p["status"],
            "rule_version": framework["version"]
        })
        
    # We could insert evidence_refs too if needed
    if kpi_inserts:
        kpi_res = supabase.table("kpi_scores").insert(kpi_inserts).execute()
    
    return {
        "assessment_id": assessment_id,
        "framework_version": framework["version"],
        "overallScore": round(total_score, 2),
        "categoryScores": category_scores,
        "parameterScores": parameter_scores,
        "evidenceCount": evidence_count,
        "missingEvidence": missing_evidence_count,
        "confidence": round(confidence, 2),
        "calculatedAt": res.data[0]["created_at"]
    }
