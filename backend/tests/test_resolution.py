import pytest
from app.services.normalization import normalize_title, normalize_doi
from app.services.resolution import resolve_publication, detect_conflicts

def test_same_doi():
    existing_pubs = [{"id": "1", "doi": "10.123/abc", "normalized_title": "test", "year": 2020}]
    match, conf = resolve_publication("test2", "10.123/abc", 2020, existing_pubs)
    assert match is not None
    assert match["id"] == "1"
    assert conf == 100.0

def test_same_title_year():
    existing_pubs = [{"id": "1", "doi": None, "normalized_title": "machine learning", "year": 2021}]
    match, conf = resolve_publication("machine learning", None, 2021, existing_pubs)
    assert match is not None
    assert conf == 95.0

def test_different_title():
    existing_pubs = [{"id": "1", "doi": None, "normalized_title": "deep learning", "year": 2021}]
    match, conf = resolve_publication("machine learning", None, 2021, existing_pubs)
    assert match is None
    assert conf == 0.0

def test_different_year():
    existing_pubs = [{"id": "1", "doi": None, "normalized_title": "machine learning", "year": 2020}]
    match, conf = resolve_publication("machine learning", None, 2021, existing_pubs)
    # Different year will fallback to similarity. "machine learning" vs "machine learning" = 1.0 -> 100%
    # Wait, exact title match with different year might still trigger similarity match > 0.85
    assert match is not None
    assert conf == 100.0
    
    # Check conflicts
    conflicts = detect_conflicts("fac1", existing_pubs[0], {"year": 2021}, "orcid")
    assert len(conflicts) == 1
    assert conflicts[0]["field_name"] == "publication_year"

def test_missing_doi():
    existing_pubs = [{"id": "1", "doi": "10.111/xyz", "normalized_title": "data science", "year": 2022}]
    # No DOI provided in new record, should match on title+year or similarity
    match, conf = resolve_publication("data science", None, 2022, existing_pubs)
    assert match is not None
    assert conf == 95.0

def test_low_confidence_match():
    existing_pubs = [{"id": "1", "doi": None, "normalized_title": "an introduction to machine learning", "year": 2021}]
    # Similarity should be below 0.85
    match, conf = resolve_publication("intro to ml", None, 2021, existing_pubs)
    assert match is None
    assert conf == 0.0
