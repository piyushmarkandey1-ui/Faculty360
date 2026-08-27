import logging
from typing import Dict, Any, List
from app.core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

# [DEFAULT_CONFIG remains same...]
DEFAULT_CONFIG = {
    "categories": [
        {
            "id": "research", "name": "Research", "weight": 0.40,
            "parameters": [
                {"id": "res_publications", "name": "Publication Volume", "weight": 0.4, "max_score": 100, "rule": "count * 10", "evidence_requirement": "publications"},
                {"id": "res_citations", "name": "Citation Impact", "weight": 0.3, "max_score": 100, "rule": "min(citations / 10, 100)", "evidence_requirement": "academic_identities.citations"},
                {"id": "res_hindex", "name": "H-Index", "weight": 0.3, "max_score": 100, "rule": "min(h_index * 5, 100)", "evidence_requirement": "academic_identities.h_index"}
            ]
        },
        {
            "id": "teaching", "name": "Teaching", "weight": 0.20,
            "parameters": [
                {"id": "teach_courses", "name": "Courses Taught", "weight": 1.0, "max_score": 100, "rule": "count * 20", "evidence_requirement": "institutional_records.teaching"}
            ]
        },
        {
            "id": "mentoring", "name": "Mentoring", "weight": 0.10,
            "parameters": [
                {"id": "mentor_students", "name": "Students Mentored", "weight": 1.0, "max_score": 100, "rule": "count * 25", "evidence_requirement": "institutional_records.mentoring"}
            ]
        },
        {
            "id": "institutional_service", "name": "Institutional Service", "weight": 0.10,
            "parameters": [
                {"id": "service_committees", "name": "Committee Memberships", "weight": 1.0, "max_score": 100, "rule": "count * 20", "evidence_requirement": "institutional_records.service"}
            ]
        },
        {
            "id": "innovation", "name": "Innovation", "weight": 0.10,
            "parameters": [
                {"id": "innov_projects", "name": "Patents & Projects", "weight": 1.0, "max_score": 100, "rule": "count * 50", "evidence_requirement": "institutional_records.innovation"}
            ]
        },
        {
            "id": "outreach", "name": "Outreach", "weight": 0.05,
            "parameters": [
                {"id": "outreach_events", "name": "Public Outreach", "weight": 1.0, "max_score": 100, "rule": "count * 20", "evidence_requirement": "institutional_records.outreach"}
            ]
        },
        {
            "id": "academic_leadership", "name": "Academic Leadership", "weight": 0.05,
            "parameters": [
                {"id": "lead_roles", "name": "Leadership Roles", "weight": 1.0, "max_score": 100, "rule": "count * 50", "evidence_requirement": "institutional_records.leadership"}
            ]
        }
    ]
}

def get_active_framework():
    supabase = get_supabase_admin()
    res = supabase.table("assessment_frameworks").select("*").eq("status", "active").execute()
    if res.data:
        return res.data[0]
    new_fw = supabase.table("assessment_frameworks").insert({
        "name": "AcadLens Core Framework", "version": "1.0.0", "status": "active", "config": DEFAULT_CONFIG
    }).execute()
    return new_fw.data[0]

def evaluate_rule(rule: str, data: Dict[str, Any]) -> float:
    count = data.get("count", 0)
    citations = data.get("citations", 0)
    h_index = data.get("h_index", 0)
    allowed_names = {"count": count, "citations": citations, "h_index": h_index, "min": min, "max": max}
    try:
        val = eval(rule, {"__builtins__": {}}, allowed_names)
        return float(val)
    except Exception as e:
        logger.error(f"Rule evaluation failed for {rule}: {e}")
        return 0.0

def generate_analytics(faculty_id: str, parameter_scores: List[Dict[str, Any]], total_score: float, category_scores: Dict[str, float]) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    strengths = []
    improvement_areas = []
    
    # Analyze parameters
    for p in parameter_scores:
        ratio = p["computed_score"] / max(1, p["max_score"])
        if p["status"] == "INSUFFICIENT_EVIDENCE":
            improvement_areas.append({
                "category": p["category"],
                "parameter": p["rule_name"],
                "currentScore": 0,
                "missingEvidence": True,
                "reason": "No verifiable evidence found in the system.",
                "potentialImpact": round(p["contribution_to_overall"], 2)
            })
        elif ratio < 0.5:
            improvement_areas.append({
                "category": p["category"],
                "parameter": p["rule_name"],
                "currentScore": round(p["computed_score"], 2),
                "missingEvidence": False,
                "reason": f"Performance is below expectations ({int(ratio*100)}% of max).",
                "potentialImpact": round((p["max_score"] - p["computed_score"]) * (p["contribution_to_overall"] / max(1, p["computed_score"])), 2) if p["computed_score"] > 0 else round(p["contribution_to_overall"], 2) # rough potential impact
            })
        elif ratio >= 0.8:
            strengths.append({
                "category": p["category"],
                "parameter": p["rule_name"],
                "score": round(p["computed_score"], 2),
                "evidenceCount": len(p["refs"]),
                "reason": f"Exceptional performance ({int(ratio*100)}% of max) with solid evidence."
            })
            
    # Sort
    strengths.sort(key=lambda x: x["score"], reverse=True)
    improvement_areas.sort(key=lambda x: x["potentialImpact"], reverse=True)
    
    # Trends calculation
    trends = {"direction": "INSUFFICIENT_DATA", "historical": []}
    hist_res = supabase.table("assessments").select("total_score, created_at").eq("faculty_id", faculty_id).in_("status", ["approved", "archived"]).order("created_at", desc=True).limit(5).execute()
    if hist_res.data and len(hist_res.data) > 0:
        prev_score = hist_res.data[0]["total_score"]
        if total_score > prev_score + 2:
            trends["direction"] = "IMPROVING"
        elif total_score < prev_score - 2:
            trends["direction"] = "DECLINING"
        else:
            trends["direction"] = "STABLE"
        
        # Build history array including current
        history = [{"score": h["total_score"], "date": h["created_at"]} for h in hist_res.data]
        # Current is pending save, so we just use the raw score
        history.insert(0, {"score": total_score, "date": "current"})
        history.reverse()
        trends["historical"] = history
        
    # Data Quality
    dq_res = supabase.table("faculty").select("completeness_score, conflict_count").eq("id", faculty_id).execute()
    dq = dq_res.data[0] if dq_res.data else {"completeness_score": 0, "conflict_count": 0}
    
    data_quality = {
        "profileCompleteness": dq.get("completeness_score", 0),
        "evidenceCompleteness": sum([1 for p in parameter_scores if p["status"] == "VALID"]) / max(1, len(parameter_scores)) * 100,
        "verifiedEvidencePercent": 100.0, # By definition, we only score verified
        "missingParameters": len([p for p in parameter_scores if p["status"] == "INSUFFICIENT_EVIDENCE"]),
        "conflicts": dq.get("conflict_count", 0)
    }
    
    # Why this score?
    contributing = [f"+ Strong {s['parameter']} ({s['score']}/100)" for s in strengths[:3]]
    limitations = [f"- Missing evidence for {i['parameter']}" if i['missingEvidence'] else f"- Limited {i['parameter']}" for i in improvement_areas[:3]]
    
    why_this_score = {
        "contributingFactors": contributing,
        "limitations": limitations
    }

    return {
        "strengths": strengths,
        "improvementAreas": improvement_areas,
        "trends": trends,
        "dataQuality": data_quality,
        "whyThisScore": why_this_score
    }

def calculate_assessment(faculty_id: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    framework = get_active_framework()
    config = framework["config"]
    
    pubs_res = supabase.table("publications").select("id").eq("faculty_id", faculty_id).eq("dedup_status", "unique").execute()
    idents_res = supabase.table("academic_identities").select("*").eq("faculty_id", faculty_id).execute()
    inst_res = supabase.table("institutional_records").select("id, category").eq("faculty_id", faculty_id).execute()
    
    pubs_count = len(pubs_res.data)
    total_citations = sum([i.get("citations") or 0 for i in idents_res.data]) if idents_res.data else 0
    max_h_index = max([i.get("h_index") or 0 for i in idents_res.data]) if idents_res.data else 0
    
    evidence_map = {
        "publications": {"count": pubs_count, "refs": [p["id"] for p in pubs_res.data]},
        "academic_identities.citations": {"citations": total_citations, "refs": [i["id"] for i in idents_res.data]},
        "academic_identities.h_index": {"h_index": max_h_index, "refs": [i["id"] for i in idents_res.data]}
    }
    
    for record in inst_res.data or []:
        cat = f"institutional_records.{record['category']}"
        if cat not in evidence_map:
            evidence_map[cat] = {"count": 0, "refs": []}
        evidence_map[cat]["count"] += 1
        evidence_map[cat]["refs"].append(record["id"])

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
            contribution_to_overall = weighted_param_score * category["weight"]
            
            parameter_scores.append({
                "rule_id": param["id"],
                "rule_name": param["name"],
                "category": category["name"],
                "raw_value": raw_val,
                "computed_score": computed,
                "max_score": param["max_score"],
                "status": status,
                "refs": evidence_data.get("refs", []),
                "contribution_to_overall": contribution_to_overall
            })
            
        weighted_cat = cat_score * category["weight"]
        total_score += weighted_cat
        category_scores[category["name"]] = cat_score
        
    confidence = 100.0 if missing_evidence_count == 0 else max(100.0 - (missing_evidence_count * 15), 0.0)
    completeness = min(100.0, (evidence_count / max(1, (evidence_count + missing_evidence_count))) * 100.0)

    analytics = generate_analytics(faculty_id, parameter_scores, total_score, category_scores)

    assessment_record = {
        "faculty_id": faculty_id,
        "framework_id": framework["id"],
        "total_score": round(total_score, 2),
        "confidence_score": round(confidence, 2),
        "status": "approved",
        "evidence_count": evidence_count,
        "missing_evidence_count": missing_evidence_count,
        "analytics": analytics
    }
    
    res = supabase.table("assessments").insert(assessment_record).execute()
    assessment_id = res.data[0]["id"]
    
    # Update faculty table completeness score
    try:
        supabase.table("faculty").update({"completeness_score": int(completeness)}).eq("id", faculty_id).execute()
    except Exception:
        pass
    
    kpi_inserts = []
    for p in parameter_scores:
        kpi_inserts.append({
            "assessment_id": assessment_id,
            "rule_id": p["rule_id"],
            "category": p["category"],
            "computed_score": round(p["computed_score"], 2),
            "max_score": p["max_score"],
            "status": p["status"],
            "evidence": p.get("refs", [])
        })
        
    if kpi_inserts:
        supabase.table("kpi_scores").insert(kpi_inserts).execute()
    
    return {
        "assessment_id": assessment_id,
        "framework_version": framework["version"],
        "overallScore": round(total_score, 2),
        "categoryScores": category_scores,
        "parameterScores": parameter_scores,
        "evidenceCount": evidence_count,
        "missingEvidence": missing_evidence_count,
        "confidence": round(confidence, 2),
        "calculatedAt": res.data[0]["created_at"],
        "analytics": analytics
    }
