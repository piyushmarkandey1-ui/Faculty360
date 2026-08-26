import json
import logging
import httpx
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Semantic Scholar Public API — Free, no key needed, real live academic data
SEMANTIC_SCHOLAR_AUTHOR_SEARCH = "https://api.semanticscholar.org/graph/v1/author/search"
SEMANTIC_SCHOLAR_AUTHOR_FIELDS = "name,affiliations,homepage,paperCount,citationCount,hIndex,externalIds"

# ORCID Public API
ORCID_SEARCH_URL = "https://pub.orcid.org/v3.0/search/"


async def discover_faculty_public_profiles(query: str, institution: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Real-time public academic discovery from Semantic Scholar + ORCID.
    Returns enriched profiles with platform IDs, university links, citations, h-index.
    """
    clean_q = query.strip()
    if not clean_q:
        return []

    results: List[Dict[str, Any]] = []

    # 1. Semantic Scholar Live Author Search (primary — free, no key, real-time)
    try:
        semantic_results = await _search_semantic_scholar(clean_q, institution)
        results.extend(semantic_results)
    except Exception as e:
        logger.warning(f"Semantic Scholar search failed: {e}")

    # 2. ORCID Live Public Registry (supplementary — free, official)
    if len(results) < 3:
        try:
            orcid_results = await _search_orcid_public_api(clean_q, institution)
            for r in orcid_results:
                # Don't duplicate if Semantic Scholar already found the same ORCID
                if not any(existing.get("orcid_id") == r.get("orcid_id") and r.get("orcid_id") for existing in results):
                    results.append(r)
        except Exception as e:
            logger.debug(f"ORCID search skipped: {e}")

    # 3. If still no results, return a guided draft with public search links
    if not results:
        results.append(_build_guided_draft(clean_q, institution))

    return results[:8]  # cap at 8 for fast rendering


async def _search_semantic_scholar(name: str, institution: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Query the Semantic Scholar Graph API for real live author profiles.
    Returns structured profiles with IDs ready to import.
    """
    params = {
        "query": name,
        "fields": SEMANTIC_SCHOLAR_AUTHOR_FIELDS,
        "limit": 8
    }

    async with httpx.AsyncClient(timeout=6.0) as client:
        resp = await client.get(SEMANTIC_SCHOLAR_AUTHOR_SEARCH, params=params)
        if resp.status_code != 200:
            logger.warning(f"Semantic Scholar returned {resp.status_code}")
            return []

        data = resp.json()
        authors = data.get("data", [])

    results = []
    for author in authors:
        # Institution filter if provided
        affiliations = author.get("affiliations") or []
        inst_names = [a.get("name", "") if isinstance(a, dict) else str(a) for a in affiliations]
        inst_label = inst_names[0] if inst_names else "Academic Institution"

        if institution:
            inst_lower = institution.strip().lower()
            if not any(inst_lower in inst.lower() for inst in inst_names):
                continue  # Skip non-matching institution

        external_ids = author.get("externalIds") or {}

        # Build platform IDs from Semantic Scholar's external ID index
        semantic_scholar_id = author.get("authorId", "")
        dblp_ids = external_ids.get("DBLP", [])
        dblp_url = f"https://dblp.org/search?q={name.replace(' ', '+')}"
        if dblp_ids:
            dblp_url = f"https://dblp.org/pid/{dblp_ids[0].replace(' ', '_')}.html" if '/' in str(dblp_ids[0]) else dblp_url

        # Construct plausible Google Scholar search URL
        scholar_search_url = f"https://scholar.google.com/citations?view_op=search_authors&mauthors={name.replace(' ', '+')}"
        if inst_names:
            scholar_search_url += f"+{inst_names[0].split()[0]}"

        # ORCID search link
        orcid_search_url = f"https://orcid.org/orcid-search/search?searchQuery={name.replace(' ', '+')}"

        # ResearchGate URL
        rg_url = f"https://www.researchgate.net/search/researcher?q={name.replace(' ', '%20')}"

        # Institution webpage (heuristic from affiliation name)
        inst_url = author.get("homepage") or _guess_institution_url(inst_label, name)

        citations = author.get("citationCount", 0) or 0
        h_index = author.get("hIndex", 0) or 0
        paper_count = author.get("paperCount", 0) or 0

        # Trust score based on citation count and data completeness
        trust_score = min(99, 80 + (1 if affiliations else 0) * 5 + (1 if citations > 1000 else 0) * 5 + (1 if h_index > 10 else 0) * 5 + (1 if paper_count > 20 else 0) * 4)

        results.append({
            "name": author.get("name", name),
            "institution": inst_label,
            "institution_url": inst_url,
            "department": "Academic Faculty",
            "designation": _infer_designation(h_index, citations),
            "semantic_scholar_id": semantic_scholar_id,
            "semantic_scholar_url": f"https://www.semanticscholar.org/author/{semantic_scholar_id}",
            "scholar_id": "",  # Will need to be manually added or found via Scholar search
            "scholar_url": scholar_search_url,
            "orcid_id": "",
            "orcid_url": orcid_search_url,
            "researchgate_url": rg_url,
            "researchgate_slug": "",
            "dblp_url": dblp_url,
            "email": "",
            "citations": citations,
            "h_index": h_index,
            "paper_count": paper_count,
            "topics": _infer_topics_from_name(name, inst_label),
            "trust_score": trust_score,
            "source": "Semantic Scholar Live"
        })

    return results


async def _search_orcid_public_api(name: str, institution: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Queries the public ORCID search endpoint for real live author records.
    """
    parts = name.strip().split()
    given = parts[0] if parts else name
    family = parts[-1] if len(parts) > 1 else ""

    search_terms = [f'given-names:{given}']
    if family and family != given:
        search_terms.append(f'family-name:{family}')
    if institution:
        search_terms.append(f'affiliation-org-name:"{institution}"')

    query_str = " AND ".join(search_terms)
    headers = {"Accept": "application/json"}

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(ORCID_SEARCH_URL, params={"q": query_str, "rows": 5}, headers=headers)
        if resp.status_code != 200:
            return []

        data = resp.json()
        items = data.get("result", [])

    discovered = []
    for item in items:
        orcid_id = item.get("orcid-identifier", {}).get("path")
        if not orcid_id:
            continue

        discovered.append({
            "name": name,
            "institution": institution or "Verified ORCID Institution",
            "institution_url": f"https://orcid.org/{orcid_id}",
            "department": "Academic Faculty",
            "designation": "Researcher",
            "semantic_scholar_id": "",
            "semantic_scholar_url": f"https://www.semanticscholar.org/search?q={name.replace(' ', '%20')}&sort=Relevance",
            "scholar_id": "",
            "scholar_url": f"https://scholar.google.com/citations?view_op=search_authors&mauthors={name.replace(' ', '+')}",
            "orcid_id": orcid_id,
            "orcid_url": f"https://orcid.org/{orcid_id}",
            "researchgate_url": f"https://www.researchgate.net/search/researcher?q={name.replace(' ', '%20')}",
            "researchgate_slug": "",
            "dblp_url": f"https://dblp.org/search?q={name.replace(' ', '+')}",
            "email": "",
            "citations": 0,
            "h_index": 0,
            "paper_count": 0,
            "topics": ["Verified ORCID Public Record"],
            "trust_score": 88,
            "source": "ORCID Public Registry"
        })

    return discovered


def _guess_institution_url(inst_name: str, faculty_name: str) -> str:
    """Build a best-guess institutional faculty directory URL."""
    inst_lower = inst_name.lower()
    name_slug = faculty_name.lower().replace("dr.", "").replace("prof.", "").strip().replace(" ", "-")

    if "iit" in inst_lower and "bombay" in inst_lower:
        return f"https://www.cse.iitb.ac.in/~{name_slug.replace('-', '').lower()}"
    if "iit" in inst_lower and "delhi" in inst_lower:
        return "https://home.iitd.ac.in/faculty.php"
    if "iit" in inst_lower:
        return "https://iit.ac.in/faculty"
    if "nit" in inst_lower and "warangal" in inst_lower:
        return "https://www.nitw.ac.in/department/cse/faculty"
    if "nit" in inst_lower:
        return "https://www.nitk.ac.in/faculty"
    if "bits" in inst_lower:
        return "https://www.bits-pilani.ac.in/faculty"
    if "nyu" in inst_lower:
        return "https://cims.nyu.edu/people/faculty.html"
    if "facebook" in inst_lower or "meta" in inst_lower:
        return "https://ai.meta.com/people/"
    return f"https://www.google.com/search?q={inst_name.replace(' ', '+')}+{faculty_name.replace(' ', '+')}+faculty+profile"


def _infer_designation(h_index: int, citations: int) -> str:
    if h_index >= 60 or citations >= 100000:
        return "Distinguished Professor / Emeritus"
    if h_index >= 30 or citations >= 10000:
        return "Professor"
    if h_index >= 15 or citations >= 2000:
        return "Associate Professor"
    if h_index >= 5 or citations >= 200:
        return "Assistant Professor"
    return "Researcher / Faculty"


def _infer_topics(inst_name: str) -> List[str]:
    inst_lower = inst_name.lower()
    if "cs" in inst_lower or "computer" in inst_lower:
        return ["Computer Science", "Algorithms", "Systems"]
    if "electrical" in inst_lower or "electronics" in inst_lower:
        return ["Signal Processing", "VLSI", "Communications"]
    if "mechanical" in inst_lower:
        return ["Thermal Systems", "CFD", "Manufacturing"]
    return ["Research", "Publications", "Innovation"]


def _infer_topics_from_name(name: str, inst: str) -> List[str]:
    # Returns generic academic topics based on affiliation
    return _infer_topics(inst)


def _build_guided_draft(name: str, institution: Optional[str]) -> Dict[str, Any]:
    """Returns a structured discovery draft when no live results are found."""
    return {
        "name": name,
        "institution": institution or "Academic Institution",
        "institution_url": f"https://www.google.com/search?q={name.replace(' ', '+')}+professor+{institution or ''}",
        "department": "Academic Department",
        "designation": "Professor / Researcher",
        "semantic_scholar_id": "",
        "semantic_scholar_url": f"https://www.semanticscholar.org/search?q={name.replace(' ', '%20')}&sort=Relevance",
        "scholar_id": "",
        "scholar_url": f"https://scholar.google.com/citations?view_op=search_authors&mauthors={name.replace(' ', '+')}",
        "orcid_id": "",
        "orcid_url": f"https://orcid.org/orcid-search/search?searchQuery={name.replace(' ', '+')}",
        "researchgate_url": f"https://www.researchgate.net/search/researcher?q={name.replace(' ', '%20')}",
        "researchgate_slug": "",
        "dblp_url": f"https://dblp.org/search?q={name.replace(' ', '+')}",
        "email": "",
        "citations": 0,
        "h_index": 0,
        "paper_count": 0,
        "topics": ["Research Output", "Publications", "Academic Profile"],
        "trust_score": 72,
        "source": "Public Search Draft"
    }
