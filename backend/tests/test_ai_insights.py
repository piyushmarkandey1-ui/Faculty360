import pytest
from app.services.ai_insights import generate_mock_insights

def test_generate_mock_insights():
    context = {
        "overall_score": 75.5,
        "completeness": 90,
        "analytics": {},
        "kpi_scores": []
    }
    insights = generate_mock_insights(context)
    
    assert "summary" in insights
    assert "75.5" in insights["summary"]
    assert len(insights["keyInsights"]) == 3
    assert len(insights["recommendedActions"]) == 2
    assert insights["strengthNarrative"] != ""
