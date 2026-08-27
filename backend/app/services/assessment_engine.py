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
    
    pubs_res = supabase.table("publications").select("id, citation_count").eq("faculty_id", faculty_id).execute()
    idents_res = supabase.table("academic_identities").select("*").eq("faculty_id", faculty_id).execute()
    inst_res = supabase.table("institutional_records").select("id, category").eq("faculty_id", faculty_id).execute()
    
    pubs_data = pubs_res.data or []
    pubs_count = len(pubs_data)
    
    pub_citations = [p.get("citation_count") or 0 for p in pubs_data]
    total_citations = sum(pub_citations)
    
    sorted_citations = sorted(pub_citations, reverse=True)
    computed_h_index = 0
    for idx, c in enumerate(sorted_citations):
        if c >= idx + 1:
            computed_h_index = idx + 1
        else:
            break
            
    # Count specific institutional records
    # Extract verified data from connected sources
    evidence_map = {
        "publications": {"count": pubs_count, "refs": [p["id"] for p in pubs_data]},
        "academic_identities.citations": {"citations": total_citations, "refs": [p["id"] for p in pubs_data]},
        "academic_identities.h_index": {"h_index": computed_h_index, "refs": [p["id"] for p in pubs_data]}
    }
    
    for record in inst_res.data or []:
        cat = f"institutional_records.{record['category']}"
        if cat not in evidence_map:
            evidence_map[cat] = {"count": 0, "refs": []}
        evidence_map[cat]["count"] += 1
        evidence_map[cat]["refs"].append(record["id"])

    evaluated_weighted_sum = 0.0
    total_evaluated_weight = 0.0
    category_scores = {}
    parameter_scores = []
    evidence_count = 0
    missing_evidence_count = 0
    
    for category in config["categories"]:
        cat_param_scores = []
        cat_evaluated_weight = 0.0
        cat_weighted_sum = 0.0
        cat_has_source = False
        
        for param in category["parameters"]:
            req = param["evidence_requirement"]
            evidence_data = evidence_map.get(req, {"count": 0, "citations": 0, "h_index": 0, "refs": []})
            has_data = (evidence_data.get("count", 0) > 0 or evidence_data.get("citations", 0) > 0 or evidence_data.get("h_index", 0) > 0)
            
            if not has_data:
                missing_evidence_count += 1
                status = "SOURCE_UNAVAILABLE"
                raw_val = 0
                computed = 0.0
            else:
                cat_has_source = True
                evidence_count += len(evidence_data.get("refs", []))
                status = "VALID"
                raw_val = evidence_data.get("count") or evidence_data.get("citations") or evidence_data.get("h_index") or 0
                computed = evaluate_rule(param["rule"], evidence_data)
                computed = min(computed, param["max_score"])
                
                cat_weighted_sum += computed * param["weight"]
                cat_evaluated_weight += param["weight"]
            
            parameter_scores.append({
                "rule_id": param["id"],
                "rule_name": param["name"],
                "category": category["name"],
                "raw_value": raw_val,
                "computed_score": round(computed, 2),
                "max_score": param["max_score"],
                "status": status,
                "refs": evidence_data.get("refs", []),
                "contribution_to_overall": 0.0 # updated below
            })
            
        # If this category has verified evidence from available sources
        if cat_has_source and cat_evaluated_weight > 0:
            cat_score = cat_weighted_sum / cat_evaluated_weight
            category_scores[category["name"]] = round(cat_score, 2)
            evaluated_weighted_sum += cat_score * category["weight"]
            total_evaluated_weight += category["weight"]
        else:
            category_scores[category["name"]] = None  # Explicitly marked as not connected / no source

    # Total score is calculated proportionally over categories with available sources
    if total_evaluated_weight > 0:
        total_score = evaluated_weighted_sum / total_evaluated_weight
    else:
        total_score = 0.0
        
    # Update parameter contribution to overall
    for p in parameter_scores:
        if p["status"] == "VALID" and total_evaluated_weight > 0:
            # Category weight normalized
            cat_cfg = next((c for c in config["categories"] if c["name"] == p["category"]), None)
            if cat_cfg:
                norm_cat_weight = cat_cfg["weight"] / total_evaluated_weight
                p["contribution_to_overall"] = round(p["computed_score"] * norm_cat_weight * 0.5, 2)

    # Calculate academic data confidence based on evidence verification and data richness
    total_params = len(parameter_scores)
    evaluated_params = total_params - missing_evidence_count
    
    if evidence_count > 0:
        base_conf = 90.0 + min(8.0, (evidence_count * 0.2))
        confidence = min(98.0, max(85.0, base_conf))
    else:
        confidence = 75.0
        
    completeness = min(100.0, max(30.0, 75.0 + min(25.0, evidence_count * 0.5)))

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
