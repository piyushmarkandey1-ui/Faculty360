import re
import urllib.parse
from typing import Optional

def normalize_title(title: str) -> str:
    """Normalize a publication or project title."""
    if not title:
        return ""
    # Lowercase
    t = title.lower()
    # Remove all non-alphanumeric except spaces
    t = re.sub(r'[^a-z0-9\s]', '', t)
    # Collapse multiple spaces
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def normalize_doi(doi: str) -> Optional[str]:
    """Normalize a DOI by removing http/https prefixes and leading spaces."""
    if not doi:
        return None
    d = doi.lower().strip()
    d = urllib.parse.unquote(d)
    
    # Strip common URL prefixes
    prefixes = ["https://doi.org/", "http://doi.org/", "doi.org/", "doi:"]
    for p in prefixes:
        if d.startswith(p):
            d = d[len(p):]
            break
            
    return d.strip()

def normalize_author_name(name: str) -> str:
    """Normalize author name (e.g., John Doe -> john doe)."""
    if not name:
        return ""
    n = name.lower()
    n = re.sub(r'[^a-z\s]', '', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n
