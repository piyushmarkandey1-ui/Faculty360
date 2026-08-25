import json
import logging
import httpx
from typing import Dict, Any
from app.core.config import settings
from app.core.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

async def generate_faculty_insights(faculty_id: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    
    # 1. Fetch latest assessment
    res = supabase.table("assessments").select("*, kpi_scores(*)").eq("faculty_id", faculty_id).eq("status", "approved").order("created_at", desc=True).limit(1).execute()
    
    if not res.data:
        raise ValueError("No active assessment found to generate insights for.")
        
    assessment = res.data[0]
    
    # 2. Check if AI already generated
    if assessment.get("ai_insights"):
        return assessment["ai_insights"]
        
    # 3. Serialize Context
    context = {
        "overall_score": assessment.get("total_score"),
        "completeness": assessment.get("completeness_score"),
        "analytics": assessment.get("analytics", {}),
        "kpi_scores": [
            {
                "rule": k["rule_name"],
                "category": k["category"],
                "score": k["computed_score"],
                "max": k["max_score"],
                "status": k["status"]
            } for k in assessment.get("kpi_scores", [])
        ]
    }
    
    # 4. If no API key, return a mock deterministic insight structure so the UI works
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not found. Returning deterministic mock insights.")
        mock = generate_mock_insights(context)
        supabase.table("assessments").update({"ai_insights": mock}).eq("id", assessment["id"]).execute()
        return mock
        
    # 5. Call LLM
    try:
        insights = await call_gemini_api(context)
        # 6. Save back to assessment
        supabase.table("assessments").update({"ai_insights": insights}).eq("id", assessment["id"]).execute()
        return insights
    except Exception as e:
        logger.error(f"AI Service failed: {e}")
        raise RuntimeError("AI Service currently unavailable.") from e

async def call_gemini_api(context: Dict[str, Any]) -> Dict[str, Any]:
    prompt = f"""You are the AcadLens AI evaluator. 
    Analyze the following verified assessment data and return a JSON object with:
    - summary: A 2-3 sentence overview.
    - keyInsights: Array of 3 key string insights.
    - strengthNarrative: 1 sentence summarizing strengths.
    - improvementNarrative: 1 sentence summarizing improvements.
    - trendNarrative: 1 sentence on the performance trend.
    - recommendedActions: Array of 2-3 constructive action strings (e.g. 'Increase mentoring documentation').

    CRITICAL RULES:
    - Use ONLY the provided data.
    - NEVER invent scores or achievements.
    - Distinguish missing evidence (INSUFFICIENT_EVIDENCE / NO DATA) from poor performance.
    - NEVER change scores.
    - Return RAW JSON ONLY, without markdown fences or additional text.

    DATA:
    {json.dumps(context)}
    """
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            }
        )
        response.raise_for_status()
        data = response.json()
        
        raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_json)

def generate_mock_insights(context: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "summary": "This is a deterministic fallback summary since the AI service is unavailable. The faculty member has an overall score of " + str(context["overall_score"]) + ".",
        "keyInsights": [
            "Data indicates strengths in documented areas.",
            "Missing evidence affects overall completeness.",
            "Deterministic algorithms ensure consistency."
        ],
        "strengthNarrative": "Demonstrates capability where evidence is fully documented.",
        "improvementNarrative": "Scores can be improved by addressing areas with insufficient evidence.",
        "trendNarrative": "Performance trend follows the deterministic tracking over time.",
        "recommendedActions": [
            "Upload missing publication identifiers.",
            "Verify institutional service records."
        ]
    }
