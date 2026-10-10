import re
from difflib import SequenceMatcher
from typing import List, Dict, Any, Optional, Tuple

HONORIFIC_PREFIXES = {
    "dr", "dr.", "doctor", "prof", "prof.", "professor",
    "mr", "mr.", "mrs", "mrs.", "ms", "ms.",
    "er", "er.", "engineer", "shri", "smt", "shrimati",
    "assoc", "assoc.", "asst", "asst.", "adjunct",
    "padma", "padmashri", "sir"
}


def clean_name_tokens(name: Optional[str]) -> List[str]:
    """
    Cleans and tokenizes a faculty name string:
    - Strips honorifics and academic titles
    - Replaces punctuation and special characters with spaces
    - Returns lower-cased list of non-empty alphabetic tokens
    """
    if not name:
        return []
    
    # Replace commas, dots, hyphens, brackets with spaces
    cleaned = re.sub(r'[^a-zA-Z\s]', ' ', str(name).lower())
    raw_tokens = [t.strip() for t in cleaned.split() if t.strip()]
    
    # Filter out known honorifics
    filtered = [t for t in raw_tokens if t not in HONORIFIC_PREFIXES]
    return filtered if filtered else raw_tokens


def get_token_signature(tokens: List[str]) -> Tuple[str, ...]:
    """Returns sorted tuple of tokens for order-independent sequence matching."""
    return tuple(sorted(tokens))


def check_initials_match(query_tokens: List[str], cand_tokens: List[str]) -> bool:
    """
    Checks if query tokens represent initials of candidate tokens, e.g.:
    ['d', 's', 'sisodia'] matches ['dilip', 'singh', 'sisodia']
    ['g', 'bhatt'] matches ['govardhan', 'bhatt']
    ['bhatt', 'g'] matches ['govardhan', 'bhatt']
    """
    if not query_tokens or not cand_tokens:
        return False
        
    # Find full words vs single letter initials in query
    q_initials = [t for t in query_tokens if len(t) == 1]
    q_full = [t for t in query_tokens if len(t) > 1]
    
    c_full = [t for t in cand_tokens if len(t) > 1]
    
    # Must have at least one matching key surname / full word
    if not any(f in c_full for f in q_full):
        return False
        
    # Check if remaining initials correspond to first letters of candidate tokens
    cand_first_letters = [t[0] for t in cand_tokens]
    for init in q_initials:
        if init not in cand_first_letters:
            return False
            
    return True


def smart_match_faculty_name(
    query_name: Optional[str],
    faculty_list: List[Dict[str, Any]],
    threshold: float = 0.78
) -> Optional[Tuple[Dict[str, Any], float, str]]:
    """
    Smartly matches a name query against the registered faculty list,
    handling inverted sequence, comma notation ('Last, First'),
    honorifics ('Dr.', 'Prof.'), abbreviations/initials ('D.S. Sisodia'),
    and typo variations.
    
    Returns (matched_faculty, score, match_type) or None.
    """
    if not query_name or not faculty_list:
        return None
        
    q_tokens = clean_name_tokens(query_name)
    if not q_tokens:
        return None
        
    q_sig = get_token_signature(q_tokens)
    q_set = set(q_tokens)
    q_str = " ".join(q_sig)
    
    # Pass 1: Order-independent exact token set match ('Bhatt, Govardhan' == 'Govardhan Bhatt')
    for f in faculty_list:
        c_name = f.get("canonical_name") or ""
        c_tokens = clean_name_tokens(c_name)
        if not c_tokens:
            continue
        c_sig = get_token_signature(c_tokens)
        if q_sig == c_sig:
            return (f, 1.0, "exact_sorted_tokens")
            
    # Pass 2: Initials & Abbreviation match ('D. S. Sisodia' == 'Dilip Singh Sisodia')
    for f in faculty_list:
        c_name = f.get("canonical_name") or ""
        c_tokens = clean_name_tokens(c_name)
        if check_initials_match(q_tokens, c_tokens) or check_initials_match(c_tokens, q_tokens):
            return (f, 0.95, "initials_match")
            
    # Pass 3: Subset match where all key tokens of query belong to candidate or vice versa
    # (e.g., 'Vibhuti Chandrakar' matches 'Dr. Vibhuti Chandrakar' or 'Govardhan Bhatt' matches 'Dr. Govardhan Bhatt')
    best_subset: Optional[Dict[str, Any]] = None
    best_subset_score = 0.0
    for f in faculty_list:
        c_name = f.get("canonical_name") or ""
        c_tokens = clean_name_tokens(c_name)
        c_set = set(c_tokens)
        if not c_set:
            continue
            
        # Jaccard overlap
        intersection = q_set.intersection(c_set)
        union = q_set.union(c_set)
        if union:
            jaccard = len(intersection) / len(union)
            if (q_set.issubset(c_set) or c_set.issubset(q_set)) and jaccard > best_subset_score:
                best_subset_score = jaccard
                best_subset = f

    if best_subset and best_subset_score >= 0.5:
        return (best_subset, 0.90 + (best_subset_score * 0.1), "token_subset_match")
        
    # Pass 4: Fuzzy sequence matching on sorted token strings
    best_fuzzy: Optional[Dict[str, Any]] = None
    best_fuzzy_score = 0.0
    for f in faculty_list:
        c_name = f.get("canonical_name") or ""
        c_tokens = clean_name_tokens(c_name)
        if not c_tokens:
            continue
        c_sig = get_token_signature(c_tokens)
        c_str = " ".join(c_sig)
        
        ratio = SequenceMatcher(None, q_str, c_str).ratio()
        if ratio > best_fuzzy_score:
            best_fuzzy_score = ratio
            best_fuzzy = f
            
    if best_fuzzy and best_fuzzy_score >= threshold:
        return (best_fuzzy, best_fuzzy_score, "fuzzy_sequence_match")
        
    return None


def split_multiple_faculty_names(raw: Optional[str]) -> List[str]:
    """
    Splits multi-faculty string representations:
    Supports delimiters: ';', '|', ' / ', ' and ', ' & '
    E.g.: 'Dr. Govardhan Bhatt; Dr. Dilip Singh Sisodia' -> ['Dr. Govardhan Bhatt', 'Dr. Dilip Singh Sisodia']
    'Govardhan Bhatt and Dilip Singh Sisodia' -> ['Govardhan Bhatt', 'Dilip Singh Sisodia']
    'Bhatt, Govardhan / Sisodia, Dilip' -> ['Bhatt, Govardhan', 'Sisodia, Dilip']
    """
    if not raw or not raw.strip():
        return []
    s = raw.strip()
    if ";" in s:
        return [p.strip() for p in s.split(";") if p.strip()]
    if "|" in s:
        return [p.strip() for p in s.split("|") if p.strip()]
    if " / " in s:
        return [p.strip() for p in s.split(" / ") if p.strip()]
    if re.search(r'\s+and\s+', s, flags=re.IGNORECASE):
        return [p.strip() for p in re.split(r'\s+and\s+', s, flags=re.IGNORECASE) if p.strip()]
    if " & " in s:
        return [p.strip() for p in s.split(" & ") if p.strip()]
    return [s]


def split_identifiers(raw: Optional[str]) -> List[str]:
    """Splits multiple comma or semicolon separated IDs/emails."""
    if not raw or not raw.strip():
        return []
    parts = re.split(r'[;,|]', raw.strip())
    return [p.strip() for p in parts if p.strip()]

