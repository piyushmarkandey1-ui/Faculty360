import pytest
from app.services.assessment_engine import evaluate_rule

def test_evaluate_rule_basic():
    data = {"count": 5}
    assert evaluate_rule("count * 10", data) == 50.0
    
def test_evaluate_rule_with_min():
    data = {"citations": 1500}
    assert evaluate_rule("min(citations / 10, 100)", data) == 100.0

def test_evaluate_rule_missing_data():
    data = {}
    # Count defaults to 0
    assert evaluate_rule("count * 10", data) == 0.0

def test_evaluate_rule_invalid_syntax():
    data = {"count": 1}
    assert evaluate_rule("count * ", data) == 0.0
import pytest
from app.services.assessment_engine import generate_analytics

def test_generate_analytics_strengths():
    param_scores = [
        {"category": "Research", "rule_name": "Pub Volume", "computed_score": 90, "max_score": 100, "status": "VALID", "contribution_to_overall": 20.0, "refs": [1,2]},
        {"category": "Teaching", "rule_name": "Courses", "computed_score": 20, "max_score": 100, "status": "VALID", "contribution_to_overall": 4.0, "refs": [1]},
    ]
    analytics = generate_analytics("fac1", param_scores, 85.0, {})
    
    assert len(analytics["strengths"]) == 1
    assert analytics["strengths"][0]["parameter"] == "Pub Volume"
    assert analytics["strengths"][0]["score"] == 90
    
    assert len(analytics["improvementAreas"]) == 1
    assert analytics["improvementAreas"][0]["parameter"] == "Courses"
    assert analytics["improvementAreas"][0]["missingEvidence"] == False
    
def test_generate_analytics_missing_evidence():
    param_scores = [
        {"category": "Innovation", "rule_name": "Patents", "computed_score": 0, "max_score": 100, "status": "INSUFFICIENT_EVIDENCE", "contribution_to_overall": 10.0, "refs": []}
    ]
    analytics = generate_analytics("fac1", param_scores, 10.0, {})
    assert len(analytics["improvementAreas"]) == 1
    assert analytics["improvementAreas"][0]["missingEvidence"] == True
    assert analytics["improvementAreas"][0]["potentialImpact"] == 10.0
    
    limitations = analytics["whyThisScore"]["limitations"]
    assert "Missing evidence for Patents" in limitations[0]
