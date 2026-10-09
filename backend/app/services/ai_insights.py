"""
AcadLens — Gemini AI Intelligence Layer
========================================
Gemini acts ONLY as explanation/insight layer on top of the existing
deterministic assessment engine. It NEVER modifies scores, invents
evidence, or overrides assessment rules.

Architecture:
  Verified Evidence → Deterministic Engine → Scores
                                                 ↓
                                             Gemini
                                                 ↓
                          Overview / Explanation / Insights / Recommendations
"""
import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

# ── Canonical output schema ─────────────────────────────────────────────────

REQUIRED_KEYS = {
    "summary", "keyInsights", "strengths",
    "improvementAreas", "trendSummary",
    "dataQualityObservations", "recommendedActions",
}

CANDIDATE_GEMINI_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-lite-latest",
]
GEMINI_MODEL = CANDIDATE_GEMINI_MODELS[0]
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
TIMEOUT_SECONDS = 25.0


# ── Public API ───────────────────────────────────────────────────────────────

async def generate_faculty_insights(faculty_id: str) -> Dict[str, Any]:
    """
    Generate or return cached AI insights for a faculty member.
    Falls back to deterministic mock if Gemini is unavailable.
    """
    supabase = get_supabase_admin()

    res = (
        supabase.table("assessments")
        .select("*, kpi_scores(*)")
        .eq("faculty_id", faculty_id)
        .eq("status", "approved")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not res.data:
        raise ValueError("No approved assessment found to generate insights for.")

    assessment = res.data[0]

    if assessment.get("ai_insights"):
        return assessment["ai_insights"]

    context = await _build_context(faculty_id, assessment, supabase)

    gemini_key = _get_key()
    if gemini_key:
        try:
            insights = await _call_gemini_insights(context, gemini_key)
            _validate_insights(insights)
        except Exception as exc:
            logger.warning(f"Gemini insights failed ({exc}); using mock fallback.")
            insights = _mock_insights(context)
    else:
        logger.info("GEMINI_API_KEY not configured — using deterministic mock.")
        insights = _mock_insights(context)

    try:
        supabase.table("assessments").update({"ai_insights": insights}).eq(
            "id", assessment["id"]
        ).execute()
    except Exception as exc:
        logger.warning(f"Could not cache AI insights: {exc}")

    return insights


async def generate_faculty_overview(faculty_id: str) -> Dict[str, Any]:
    """
    Generate a short natural-language overview for the Faculty Profile page.
    Returns {"overview": "..."}
    """
    supabase = get_supabase_admin()

    fac_res = (
        supabase.table("faculty")
        .select("canonical_name, department, designation, completeness_score")
        .eq("id", faculty_id)
        .execute()
    )
    fac = fac_res.data[0] if fac_res.data else {}

    ass_res = (
        supabase.table("assessments")
        .select("total_score, confidence_score, analytics")
        .eq("faculty_id", faculty_id)
        .eq("status", "approved")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    ass = ass_res.data[0] if ass_res.data else {}

    pub_res = (
        supabase.table("publications")
        .select("id", count="exact")
        .eq("faculty_id", faculty_id)
        .execute()
    )
    pub_count = pub_res.count or 0

    profile_ctx = {
        "name": fac.get("canonical_name", "Unknown"),
        "department": fac.get("department", "Unknown"),
        "designation": fac.get("designation", ""),
        "profile_completeness_pct": fac.get("completeness_score", 0),
        "overall_score": ass.get("total_score"),
        "confidence": ass.get("confidence_score"),
        "publication_count": pub_count,
        "strengths": (ass.get("analytics") or {}).get("strengths", []),
        "improvement_areas": (ass.get("analytics") or {}).get("improvementAreas", []),
    }

    gemini_key = _get_key()
    if gemini_key:
        try:
            overview = await _call_gemini_overview(profile_ctx, gemini_key)
            return {"overview": overview}
        except Exception as exc:
            logger.warning(f"Gemini overview failed ({exc}); using mock.")

    return {"overview": _mock_overview(profile_ctx)}


# ── Context builder ──────────────────────────────────────────────────────────

async def _build_context(faculty_id: str, assessment: Dict[str, Any], supabase) -> Dict[str, Any]:
    fac_res = (
        supabase.table("faculty")
        .select("canonical_name, department, designation, completeness_score")
        .eq("id", faculty_id)
        .execute()
    )
    fac = fac_res.data[0] if fac_res.data else {}

    pub_res = (
        supabase.table("publications")
        .select("id, citation_count")
        .eq("faculty_id", faculty_id)
        .execute()
    )
    pubs = pub_res.data or []
    total_citations = sum(p.get("citation_count") or 0 for p in pubs)

    ident_res = (
        supabase.table("academic_identities")
        .select("*")
        .eq("faculty_id", faculty_id)
        .execute()
    )
    identities = ident_res.data or []

    kpi_rows = [
        {
            "parameter_id": k.get("rule_id", "unknown"),
            "category": k.get("category", ""),
            "score": k.get("computed_score", 0),
            "max_score": k.get("max_score", 100),
            "evidence_status": k.get("status", ""),
        }
        for k in (assessment.get("kpi_scores") or [])
    ]

    analytics = assessment.get("analytics") or {}

    return {
        "faculty": {
            "name": fac.get("canonical_name", "Unknown"),
            "department": fac.get("department", ""),
            "designation": fac.get("designation", ""),
            "profile_completeness_pct": fac.get("completeness_score", 0),
        },
        "assessment": {
            "overall_score": assessment.get("total_score"),
            "confidence_score": assessment.get("confidence_score"),
            "completeness_score": assessment.get("completeness_score"),
            "evidence_count": assessment.get("evidence_count", 0),
            "missing_evidence_count": assessment.get("missing_evidence_count", 0),
        },
        "publications": {
            "count": len(pubs),
            "total_citations": total_citations,
            "evidence_status": "VERIFIED" if pubs else "MISSING_EVIDENCE",
        },
        "academic_identities": [
            {
                "source": i.get("source_type") or i.get("source"),
                "profile_url": i.get("profile_url"),
                "evidence_status": "VERIFIED" if i.get("is_verified") else "UNVERIFIED",
            }
            for i in identities
        ],
        "kpi_scores": kpi_rows,
        "strengths": analytics.get("strengths", []),
        "improvement_areas": analytics.get("improvementAreas", []),
        "why_this_score": analytics.get("whyThisScore", {}),
        "data_quality": analytics.get("dataQuality", {}),
        "trend": analytics.get("trends", {}),
    }


# ── Gemini callers ───────────────────────────────────────────────────────────

async def _execute_gemini_request(prompt: str, api_key: str, is_json: bool = True, temperature: float = 0.15) -> str:
    last_err = None
    gen_config = {"temperature": temperature}
    if is_json:
        gen_config["responseMimeType"] = "application/json"

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        for model in CANDIDATE_GEMINI_MODELS:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                response = await client.post(
                    f"{endpoint}?key={api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": gen_config,
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"].strip()
                else:
                    last_err = f"Model {model} returned HTTP {response.status_code}: {response.text[:120]}"
                    logger.warning(f"Gemini fallback warning: {last_err}")
            except Exception as e:
                last_err = str(e)
                logger.warning(f"Gemini model {model} attempt error: {e}")

    raise RuntimeError(f"All Gemini models exhausted: {last_err}")


async def _call_gemini_insights(context: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    prompt = f"""You are the AcadLens AI evaluator. Your role is to explain and summarise
verified academic performance data. You MUST NOT modify scores, invent evidence,
or make claims beyond the supplied data.

EVIDENCE GROUNDING RULES:
- Label each claim as VERIFIED, UNVERIFIED, MISSING_EVIDENCE, or CONFLICTING.
- Do not convert missing evidence into a negative achievement claim.
- Never invent publications, citations, awards, or scores.
- Official scores are set by the deterministic engine; you only explain them.

Return a single raw JSON object matching this EXACT schema (no markdown fences):
{{
  "summary": "<2-3 sentence overview of the faculty member's performance>",
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvementAreas": ["<area 1>", "<area 2>"],
  "trendSummary": "<1 sentence on performance trend>",
  "dataQualityObservations": ["<observation about evidence quality>"],
  "recommendedActions": ["<actionable recommendation 1>", "<actionable recommendation 2>"]
}}

DATA (do not modify):
{json.dumps(context, indent=2)}
"""
    raw = await _execute_gemini_request(prompt, api_key, is_json=True, temperature=0.15)
    clean = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    clean = re.sub(r"\s*```$", "", clean).strip()
    start_idx = clean.find("{")
    end_idx = clean.rfind("}")
    if start_idx != -1 and end_idx != -1:
        clean = clean[start_idx:end_idx + 1]
    return json.loads(clean)


async def _call_gemini_overview(profile_ctx: Dict[str, Any], api_key: str) -> str:
    prompt = f"""You are the AcadLens AI assistant. Write a concise, professional
2-3 sentence overview of the following faculty member based ONLY on the
supplied verified data. Do not invent any details. Return only the plain text
overview — no JSON, no markdown.

DATA:
{json.dumps(profile_ctx, indent=2)}
"""
    raw = await _execute_gemini_request(prompt, api_key, is_json=False, temperature=0.1)
    clean = re.sub(r"^```(?:markdown|text)?\s*", "", raw, flags=re.IGNORECASE)
    clean = re.sub(r"\s*```$", "", clean).strip()
    return clean


# ── Validation ───────────────────────────────────────────────────────────────

def _validate_insights(insights: Any) -> None:
    if not isinstance(insights, dict):
        raise ValueError("Gemini response is not a JSON object.")
    missing = REQUIRED_KEYS - set(insights.keys())
    if missing:
        raise ValueError(f"Gemini response missing keys: {missing}")
    for key in ("keyInsights", "strengths", "improvementAreas",
                "dataQualityObservations", "recommendedActions"):
        if not isinstance(insights.get(key), list):
            raise ValueError(f"Gemini field '{key}' must be a list.")


# ── Mock / deterministic fallback ────────────────────────────────────────────

def _mock_insights(context: Dict[str, Any]) -> Dict[str, Any]:
    ass = context.get("assessment", {})
    score = ass.get("overall_score") or 0
    missing = ass.get("missing_evidence_count", 0)
    evidence = ass.get("evidence_count", 0)
    pub = context.get("publications", {})
    trend = context.get("trend", {})
    strengths = context.get("strengths", [])
    improvements = context.get("improvement_areas", [])

    trend_dir = trend.get("direction", "INSUFFICIENT_DATA")
    trend_sentence = {
        "IMPROVING": "Performance trend is improving compared to previous assessments.",
        "DECLINING": "Performance has declined since the last assessment period.",
        "STABLE": "Performance has remained stable across recent assessment cycles.",
    }.get(trend_dir, "Insufficient historical data to determine a trend.")

    strength_texts = [
        f"{s['parameter']} ({s['score']}/100)" for s in strengths[:3]
    ] if strengths else ["Documented areas show consistent evidence."]

    improvement_texts = [
        f"{'Missing evidence for' if i.get('missingEvidence') else 'Improve'} {i['parameter']}"
        for i in improvements[:2]
    ] if improvements else ["Upload additional evidence to improve completeness."]

    dq_obs = (
        f"Profile completeness is {ass.get('completeness_score', 0):.0f}%. "
        f"{missing} parameter(s) lack verified evidence."
        if missing > 0
        else "All assessed parameters have verified evidence."
    )

    return {
        "summary": (
            f"Based on verified data, this faculty member has an overall AcadLens score of "
            f"{score}. The assessment is grounded in {evidence} verified evidence item(s) "
            f"across {7 - missing} of 7 parameter categories."
        ),
        "keyInsights": [
            f"Overall score: {score}/100 (deterministic calculation).",
            f"{pub.get('count', 0)} publication(s) with {pub.get('total_citations', 0)} total citation(s) recorded.",
            f"{missing} parameter(s) could not be scored due to missing evidence.",
        ],
        "strengths": strength_texts,
        "improvementAreas": improvement_texts,
        "trendSummary": trend_sentence,
        "dataQualityObservations": [dq_obs],
        "recommendedActions": [
            "Connect additional data sources to improve evidence coverage.",
            "Upload publication identifiers to increase citation verification.",
        ],
    }


def _mock_overview(ctx: Dict[str, Any]) -> str:
    score_str = f" with an overall AcadLens score of {ctx['overall_score']}" if ctx.get("overall_score") else ""
    return (
        f"{ctx.get('name', 'This faculty member')} is a {ctx.get('designation', 'faculty member')} "
        f"in {ctx.get('department', 'Engineering')}{score_str}. "
        f"They have {ctx.get('publication_count', 0)} verified publication(s) on record, demonstrating sustained academic engagement and impactful scholarly contributions."
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_key() -> Optional[str]:
    import os
    raw = os.environ.get("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or ""
    key = str(raw).replace("\\n", "").replace("\\r", "").strip().strip('"').strip("'")
    if not key or key.lower() in ("demo", "undefined", "null", "none", ""):
        return None
    return key

async def generate_framework_suggestions(config: dict) -> list:
    """
    Generate Gemini AI suggestions for assessment framework optimization.
    Returns a list of suggestion objects.
    """
    from app.core.config import settings
    import httpx, json, logging
    logger = logging.getLogger(__name__)

    key = _get_key()
    if not key:
        return [{"id": "gemini-missing", "type": "warning", "message": "Gemini API key is not configured.", "impact": "low"}]
        
    prompt = f"""
    You are an expert academic evaluator. Review the following faculty assessment framework configuration.
    Suggest missing parameters, weight improvements, duplicate/redundant parameters, or better evidence mapping.
    Return ONLY a JSON array of objects with this exact structure:
    [
      {{
        "id": "unique-id",
        "type": "add_parameter" | "edit_weight" | "remove_parameter" | "general_advice",
        "message": "Clear explanation of the suggestion",
        "impact": "high" | "medium" | "low",
        "action_payload": {{}}
      }}
    ]
    
    Configuration:
    {json.dumps(config, indent=2)}
    """
    
    try:
        raw_text = await _execute_gemini_request(prompt, key, is_json=True, temperature=0.3)
        clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.IGNORECASE)
        clean_text = re.sub(r"\s*```$", "", clean_text).strip()
        start_idx = clean_text.find("[")
        end_idx = clean_text.rfind("]")
        if start_idx != -1 and end_idx != -1:
            clean_text = clean_text[start_idx:end_idx + 1]
        return json.loads(clean_text)
        
    except Exception as e:
        logger.error(f"Failed to generate framework suggestions: {e}")
        return [{"id": "error", "type": "warning", "message": "Failed to analyze framework.", "impact": "low"}]
