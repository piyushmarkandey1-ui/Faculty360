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
