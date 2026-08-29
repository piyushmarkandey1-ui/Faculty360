import difflib
from typing import Dict, Any, List, Tuple, Optional

def calculate_similarity(s1: str, s2: str) -> float:
    if not s1 or not s2:
        return 0.0
    return difflib.SequenceMatcher(None, s1, s2).ratio()

def resolve_publication(
    norm_title: str, 
    norm_doi: Optional[str], 
    year: Optional[int], 
    existing_pubs: List[Dict[str, Any]]
) -> Tuple[Optional[Dict[str, Any]], float]:
    """
    Match a new publication against existing ones.
    Returns (match_dict, confidence_score) or (None, 0.0)
    Matching rules:
    1. Exact DOI match -> 100% confidence
    2. Normalized Title + Year match -> 95% confidence
    3. Strong Title similarity (>85%) -> similarity * 100 confidence
    """
    
    # 1. Exact DOI match
    if norm_doi:
        for pub in existing_pubs:
            if pub.get("doi") == norm_doi:
                return pub, 100.0
                
    # 2. Normalized Title + Year match
    for pub in existing_pubs:
        db_norm_title = pub.get("normalized_title", "")
        if db_norm_title == norm_title:
            if pub.get("year") == year:
                return pub, 95.0
                
    # 3. Strong Title similarity
    best_match = None
    best_score = 0.0
    
    for pub in existing_pubs:
        db_norm_title = pub.get("normalized_title", "")
        sim = calculate_similarity(norm_title, db_norm_title)
        if sim > best_score:
            best_score = sim
            best_match = pub
            
    if best_score > 0.85:
        return best_match, best_score * 100.0
        
    return None, 0.0

def detect_conflicts(
    faculty_id: str,
    existing_pub: Dict[str, Any],
    new_article: Dict[str, Any],
    source_type: str
) -> List[Dict[str, Any]]:
    """
    Detect conflicts between an existing unified record and a new incoming record.
    """
    conflicts = []
    
    # Check Year
    existing_year = existing_pub.get("year")
    new_year = new_article.get("year")
    if existing_year and new_year and existing_year != new_year:
        conflicts.append({
            "faculty_id": faculty_id,
            "field_name": "publication_year",
            "source_a": existing_pub.get("source_type", "primary"),
            "value_a": str(existing_year),
            "source_b": source_type,
            "value_b": str(new_year),
            "severity": "medium",
            "status": "OPEN"
        })
        
    # Check DOI
    existing_doi = existing_pub.get("doi")
    new_doi = new_article.get("doi")
    if existing_doi and new_doi and existing_doi != new_doi:
        conflicts.append({
            "faculty_id": faculty_id,
            "field_name": "publication_doi",
            "source_a": existing_pub.get("source_type", "primary"),
            "value_a": existing_doi,
            "source_b": source_type,
            "value_b": new_doi,
            "severity": "high",
            "status": "OPEN"
        })
        
    return conflicts
