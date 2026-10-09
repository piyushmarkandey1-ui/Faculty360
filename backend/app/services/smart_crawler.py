import asyncio
import json
import logging
import os
import re
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Current Gemini models (updated October 2026) ──────────────────────────────
# Primary model for fast, cheap extraction. Falls back down the list.
GEMINI_MODELS_FLASH = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
]
GEMINI_MODELS_PRO = [
    "gemini-3.8-flash",   # Use flash as default — Pro is overkill for extraction
    "gemini-pro-latest",
]


def _clean_gemini_key() -> Optional[str]:
    raw = os.environ.get("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", "") or ""
    key = str(raw).replace("\\n", "").replace("\\r", "").strip().strip('"').strip("'")
    if not key or key.lower() in ("demo", "undefined", "null", "none", ""):
        return None
    return key


def _get_apify_token() -> Optional[str]:
    raw = os.environ.get("APIFY_API_TOKEN") or os.environ.get("APIFY_TOKEN") or os.environ.get("APIFY_KEY") or ""
    token = str(raw).replace("\\n", "").replace("\\r", "").strip().strip('"').strip("'")
    if not token or token.lower() in ("demo", "undefined", "null", "none", ""):
        return None
    return token


async def _crawl_with_apify(url: str, token: str) -> Optional[str]:
    """Crawl a webpage via Apify Web Scraper Actor if token is configured."""
    try:
        from apify_client import ApifyClient
        client = ApifyClient(token)
        run_input = {
            "startUrls": [{"url": url}],
            "maxRequestsPerCrawl": 2,
            "maxCrawlingDepth": 1,
        }
        run = client.actor("apify/cheerio-scraper").call(run_input=run_input, timeout_secs=15)
        if run and run.get("defaultDatasetId"):
            dataset_items = client.dataset(run["defaultDatasetId"]).list_items().items
            if dataset_items:
                extracted_texts = [item.get("text", "") or item.get("body", "") for item in dataset_items]
                return " ".join(extracted_texts)[:15000]
    except Exception as e:
        logger.warning(f"Apify crawl attempt failed: {e}")
    return None


async def _lookup_institution_domain(institution: str) -> Optional[str]:
    """Discover the official institutional domain via OpenAlex institutions registry."""
    if not institution or len(institution.strip()) < 3:
        return None
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            url = f"https://api.openalex.org/institutions?search={urllib.parse.quote(institution)}"
            resp = await client.get(url, headers={"User-Agent": "mailto:admin@faculty360.edu"})
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    homepage = results[0].get("homepage_url")
                    if homepage:
                        return homepage.rstrip("/")
    except Exception as e:
        logger.warning(f"Institution domain lookup notice: {e}")
    return None


# ── Precise Academic Data Extraction Helpers (Zero Fabricated Data) ───────────

def _extract_year(text: str) -> Optional[int]:
    """Extract a 4-digit academic year between 1970 and 2026 if present."""
    match = re.search(r"\b(19[7-9]\d|20[0-2]\d)\b", text)
    return int(match.group(1)) if match else None


def _extract_course_code(text: str) -> Optional[str]:
    """Extract real course code like CS101, ECE-302, ME 450 if present."""
    match = re.search(r"\b([A-Z]{2,4}[-\s]?\d{3,4}[A-Z]?)\b", text)
    return match.group(1) if match else None


def _extract_level(text: str) -> Optional[str]:
    """Extract course or degree level if present in text."""
    lower = text.lower()
    if any(k in lower for k in ["undergraduate", "b.tech", "btech", "b.s.", "bachelor", "ug"]):
        return "Undergraduate"
    if any(k in lower for k in ["postgraduate", "m.tech", "mtech", "m.s.", "master", "pg"]):
        return "Postgraduate"
    if any(k in lower for k in ["doctoral", "ph.d", "phd"]):
        return "Doctoral"
    return None


def _extract_term(text: str) -> Optional[str]:
    """Extract semester or academic term if present."""
    match = re.search(r"\b(Spring|Fall|Autumn|Winter|Monsoon|Summer|Semester\s*[I|V|X\d]+|Term\s*\d+)\s*(?:20\d\d)?\b", text, re.IGNORECASE)
    return match.group(0).strip() if match else None


def _extract_duration_hours(text: str) -> Optional[int]:
    """Extract course hours or credits if present in text."""
    match = re.search(r"\b(\d{1,3})\s*(?:hours|hrs|hours/week|contact hours)\b", text, re.IGNORECASE)
    return int(match.group(1)) if match else None


def _extract_feedback_score(text: str) -> Optional[float]:
    """Extract student feedback score / rating if present in text."""
    match = re.search(r"(?:feedback|rating|score|evaluation):\s*(\d(?:\.\d{1,2})?)\s*(?:/\s*5)?\b", text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return None


def _extract_amount_lakhs(text: str) -> Optional[float]:
    """Extract grant / funding amount if present in text."""
    m_cr = re.search(r"(?:rs\.?|inr|₹)\s*([\d\.]+)\s*(?:cr|crore)", text, re.IGNORECASE)
    if m_cr:
        try:
            return round(float(m_cr.group(1)) * 100.0, 2)
        except ValueError:
            pass
    m_lakh = re.search(r"(?:rs\.?|inr|₹)?\s*([\d\.]+)\s*(?:lakh|lac|l\b)", text, re.IGNORECASE)
    if m_lakh:
        try:
            return round(float(m_lakh.group(1)), 2)
        except ValueError:
            pass
    m_usd = re.search(r"\$\s*([\d,]+)", text)
    if m_usd:
        try:
            val = float(m_usd.group(1).replace(",", ""))
            return round(val * 83.0 / 100000.0, 2)
        except ValueError:
            pass
    return None


def _extract_patent_number(text: str) -> Optional[str]:
    """Extract real patent application or grant number."""
    m = re.search(r"\b(US\s*\d{6,}[A-Z\d]*|WO\s*\d{4,}[A-Z\d]*|EP\s*\d{6,}[A-Z\d]*|\d{12}|\d{4}/\d{4,}|IN\s*\d{6,})\b", text, re.IGNORECASE)
    return m.group(1) if m else None


def _extract_funding_agency(text: str) -> Optional[str]:
    """Extract recognized funding agency from text."""
    agencies = [
        "DST-SERB", "SERB", "DST", "DBT", "DRDO", "ISRO", "MeitY", "CSIR",
        "UGC", "AICTE", "ICMR", "ICAR", "MHRD", "MoE", "BARC", "DAE",
        "NSF", "NIH", "DARPA", "DOE", "NASA", "European Commission", "Horizon Europe",
        "EPSRC", "UKRI", "Wellcome Trust", "Gates Foundation", "Google Research",
        "Microsoft Research", "IBM Research", "Intel", "Amazon AWS", "Qualcomm"
    ]
    for a in agencies:
        if re.search(rf"\b{re.escape(a)}\b", text, re.IGNORECASE):
            return a
    m = re.search(r"(?:sponsored by|funded by|grant from|agency:\s*)\s*([A-Za-z0-9\s&]+?)(?:,|\.|\(|\)|;|\n|$)", text, re.IGNORECASE)
    if m and len(m.group(1).strip()) > 2 and len(m.group(1).strip()) < 50:
        return m.group(1).strip()
    return None


def _extract_role(text: str) -> Optional[str]:
    """Extract PI, Co-PI, Lead, Coordinator role."""
    if re.search(r"\b(?:co-pi|co\s*principal\s*investigator|co-investigator)\b", text, re.IGNORECASE):
        return "Co-Principal Investigator"
    if re.search(r"\b(?:pi\b|principal\s*investigator|project\s*lead|lead\s*investigator)\b", text, re.IGNORECASE):
        return "Principal Investigator"
    if re.search(r"\b(?:coordinator|project\s*director|mentor)\b", text, re.IGNORECASE):
        return "Coordinator"
    return None


def _extract_status(text: str) -> Optional[str]:
    """Extract project or patent status."""
    if re.search(r"\b(?:granted|awarded|approved)\b", text, re.IGNORECASE):
        return "Granted"
    if re.search(r"\b(?:published|disclosed)\b", text, re.IGNORECASE):
        return "Published"
    if re.search(r"\b(?:filed|applied|submitted|pending)\b", text, re.IGNORECASE):
        return "Filed"
    if re.search(r"\b(?:completed|closed|concluded)\b", text, re.IGNORECASE):
        return "Completed"
    if re.search(r"\b(?:ongoing|in\s*progress|active|current)\b", text, re.IGNORECASE):
        return "Ongoing"
    return None


def _extract_country(text: str) -> Optional[str]:
    """Extract patent jurisdiction / country."""
    lower = text.lower()
    if any(k in lower for k in ["india", "indian", "ipo"]):
        return "India"
    if any(k in lower for k in ["uspto", "united states", "usa"]):
        return "United States"
    if any(k in lower for k in ["wipo", "pct", "international"]):
        return "International (PCT)"
    if any(k in lower for k in ["epo", "europe", "european"]):
        return "Europe"
    return None


def _extract_mentoring_type(text: str) -> Optional[str]:
    """Extract mentoring or student supervision level."""
    lower = text.lower()
    if any(k in lower for k in ["ph.d", "phd", "doctoral"]):
        return "Ph.D. Supervision"
    if any(k in lower for k in ["m.tech", "mtech", "ms", "m.s.", "masters", "master"]):
        return "Master's Thesis"
    if any(k in lower for k in ["b.tech", "btech", "b.s.", "undergraduate", "bachelor"]):
        return "Undergraduate Project"
    if any(k in lower for k in ["postdoc", "postdoctoral"]):
        return "Postdoctoral Mentoring"
    return None


def _extract_student_count(text: str) -> Optional[int]:
    """Extract count of students or candidates supervised."""
    m = re.search(r"\b(\d{1,3})\s*(?:students?|scholars?|candidates?|theses|dissertations)\b", text, re.IGNORECASE)
    return int(m.group(1)) if m else None


def _extract_activity_type(text: str) -> Optional[str]:
    """Extract outreach or scholarly service activity type."""
    lower = text.lower()
    if any(k in lower for k in ["keynote", "invited talk", "guest lecture", "invited speaker"]):
        return "Invited Talk"
    if any(k in lower for k in ["session chair", "track chair", "conference chair", "general chair"]):
        return "Session / Conference Chair"
    if any(k in lower for k in ["reviewer", "referee"]):
        return "Peer Reviewer"
    if any(k in lower for k in ["editor", "editorial board", "associate editor"]):
        return "Journal Editor"
    if any(k in lower for k in ["workshop", "symposium", "panelist"]):
        return "Workshop / Panelist"
    return None


def _extract_degree(text: str) -> Optional[str]:
    """Extract degree from education text."""
    lower = text.lower()
    if any(k in lower for k in ["ph.d", "phd", "doctor of philosophy"]):
        return "Ph.D."
    if any(k in lower for k in ["m.tech", "mtech"]):
        return "M.Tech"
    if any(k in lower for k in ["m.s.", "ms", "master of science"]):
        return "M.S."
    if any(k in lower for k in ["b.tech", "btech"]):
        return "B.Tech"
    if any(k in lower for k in ["b.e.", "be"]):
        return "B.E."
    if any(k in lower for k in ["b.s.", "bs", "bachelor of science"]):
        return "B.S."
    return None


def _extract_designation(text: str) -> Optional[str]:
    """Extract academic designation from experience text."""
    lower = text.lower()
    if "professor & head" in lower or "professor and head" in lower:
        return "Professor & Head"
    if "associate professor" in lower:
        return "Associate Professor"
    if "assistant professor" in lower:
        return "Assistant Professor"
    if "dean" in lower:
        return "Dean"
    if "professor" in lower:
        return "Professor"
    if "postdoctoral" in lower or "postdoc" in lower:
        return "Postdoctoral Researcher"
    if "lecturer" in lower:
        return "Lecturer"
    return None


# ── Structured Section Parser (Zero Placeholders) ──────────────────────────────

def _parse_academic_sections_from_html(soup: BeautifulSoup, source_url: str, source_label: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Extract real academic records (teaching, grants, patents, mentoring, service)
    from raw institutional HTML with zero placeholders or fabricated fallback values.
    """
    sections = {
        "teaching": [],
        "projects": [],
        "patents": [],
        "mentoring": [],
        "institutional_service": [],
        "outreach": [],
        "education": [],
        "experience": []
    }

    for h in soup.find_all(["h1", "h2", "h3", "h4", "h5", "strong", "b", "th", "dt"]):
        heading_text = h.get_text(separator=" ", strip=True).lower()
        if not heading_text or len(heading_text) > 70:
            continue

        target_cat = None
        if any(k in heading_text for k in ["course", "teaching", "subject", "instruction", "classes"]):
            target_cat = "teaching"
        elif any(k in heading_text for k in ["project", "grant", "funding", "sponsored research", "consultancy"]):
            target_cat = "projects"
        elif any(k in heading_text for k in ["patent", "ipr", "invention", "intellectual property"]):
            target_cat = "patents"
        elif any(k in heading_text for k in ["mentor", "supervis", "phd guide", "ph.d. guide", "thesis", "dissertation", "students supervised"]):
            target_cat = "mentoring"
        elif any(k in heading_text for k in ["administrative", "committee", "responsibility", "governance", "service"]):
            target_cat = "institutional_service"
        elif any(k in heading_text for k in ["outreach", "keynote", "invited talk", "session chair", "reviewer", "editor"]):
            target_cat = "outreach"
        elif any(k in heading_text for k in ["education", "degree", "qualification", "academic background"]):
            target_cat = "education"
        elif any(k in heading_text for k in ["experience", "position", "employment", "career", "appointment"]):
            target_cat = "experience"

        if not target_cat:
            continue

        container = h.find_next(["ul", "ol", "table", "div", "dl", "p"])
        if not container:
            continue

        items = []
        if container.name in ["ul", "ol"]:
            items = [li.get_text(separator=" ", strip=True) for li in container.find_all("li") if len(li.get_text(strip=True)) > 4]
        elif container.name == "table":
            headers = [th.get_text(strip=True).lower() for th in container.find_all(["th"])]
            for tr in container.find_all("tr"):
                tds = [td.get_text(separator=" ", strip=True) for td in tr.find_all(["td"])]
                if tds:
                    items.append(" • ".join([td for td in tds if td]))
        elif container.name == "dl":
            items = [dd.get_text(separator=" ", strip=True) for dd in container.find_all(["dd", "dt"]) if len(dd.get_text(strip=True)) > 4]
        else:
            items = [p.get_text(separator=" ", strip=True) for p in container.find_all(["p", "span"]) if len(p.get_text(strip=True)) > 10][:6]

        for it in items[:8]:
            clean_it = it.strip()
            if len(clean_it) < 4:
                continue

            if target_cat == "teaching":
                code = _extract_course_code(clean_it)
                sections["teaching"].append({
                    "course_name": clean_it[:120],
                    "course_code": code,
                    "level": _extract_level(clean_it),
                    "term": _extract_term(clean_it),
                    "duration_hours": _extract_duration_hours(clean_it),
                    "student_feedback_score": _extract_feedback_score(clean_it),
                    "year": _extract_year(clean_it),
                    "source_name": source_label,
                    "source_url": source_url
                })
            elif target_cat == "projects":
                sections["projects"].append({
                    "title": clean_it[:160],
                    "funding_agency": _extract_funding_agency(clean_it),
                    "amount_inr_lakhs": _extract_amount_lakhs(clean_it),
                    "role": _extract_role(clean_it),
                    "status": _extract_status(clean_it),
                    "year": _extract_year(clean_it),
                    "source_name": source_label,
                    "source_url": source_url
                })
            elif target_cat == "patents":
                sections["patents"].append({
                    "title": clean_it[:160],
                    "patent_no": _extract_patent_number(clean_it),
                    "filing_year": _extract_year(clean_it),
                    "status": _extract_status(clean_it),
                    "country": _extract_country(clean_it),
                    "source_name": source_label,
                    "source_url": source_url
                })
            elif target_cat == "mentoring":
                sections["mentoring"].append({
                    "type": _extract_mentoring_type(clean_it),
                    "count": _extract_student_count(clean_it),
                    "status": _extract_status(clean_it),
                    "description": clean_it[:180],
                    "year": _extract_year(clean_it),
                    "source_name": source_label,
                    "source_url": source_url
                })
            elif target_cat == "institutional_service":
                sections["institutional_service"].append({
                    "role_name": clean_it[:80],
                    "body_or_committee": clean_it[:120],
                    "duration": None,
                    "year": _extract_year(clean_it),
                    "source_name": source_label,
                    "source_url": source_url
                })
            elif target_cat == "outreach":
                sections["outreach"].append({
                    "activity_type": _extract_activity_type(clean_it),
                    "title": clean_it[:160],
                    "venue": None,
                    "year": _extract_year(clean_it),
                    "source_name": source_label,
                    "source_url": source_url
                })
            elif target_cat == "education":
                sections["education"].append({
                    "degree": _extract_degree(clean_it),
                    "institution": None,
                    "year": _extract_year(clean_it),
                    "description": clean_it[:140],
                    "source_name": source_label,
                    "source_url": source_url
                })
            elif target_cat == "experience":
                sections["experience"].append({
                    "designation": _extract_designation(clean_it),
                    "organization": None,
                    "year": _extract_year(clean_it),
                    "description": clean_it[:140],
                    "source_name": source_label,
                    "source_url": source_url
                })

    return sections


# ── URL Discovery: Gemini ONLY For Official URLs, With Web Search Fallback ────

async def _ask_gemini_for_institutional_urls(
    name: str,
    institution: str,
    department: str,
    api_key: str
) -> List[str]:
    """
    Use Gemini ONLY to identify what official website or faculty page URLs
    the smart crawler should crawl for institutional data.
    """
    prompt = f"""Identify the official university faculty profile and departmental webpage URLs for:
Faculty Member: {name}
Institution: {institution}
Department: {department}

Identify up to 4 official URLs on the university domain, including:
1. Main faculty directory or profile page
2. Department faculty page or lab page
3. Courses/teaching or research/grants page if separate
4. Publications or CV page on the institution website

Return ONLY a valid JSON list of strings (e.g. ["https://..."]). Do not include search engine URLs or social networks like LinkedIn/Twitter. If unknown, return []."""

    async with httpx.AsyncClient(timeout=12.0) as client:
        for model in GEMINI_MODELS_FLASH:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                resp = await client.post(
                    f"{endpoint}?key={api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.0,
                            "responseMimeType": "application/json"
                        }
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and candidates[0].get("content", {}).get("parts"):
                        raw = candidates[0]["content"]["parts"][0].get("text", "").strip()
                        clean = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
                        clean = re.sub(r"\s*```$", "", clean).strip()
                        urls = json.loads(clean)
                        if isinstance(urls, list):
                            valid = [u for u in urls if isinstance(u, str) and u.startswith("http")]
                            if valid:
                                logger.info(f"Gemini identified institutional URLs: {valid}")
                                return valid
            except Exception as e:
                logger.warning(f"Gemini URL lookup with {model} note: {e}")
    return []


async def _search_institutional_page(name: str, institution: str, department: str) -> List[str]:
    """Search for the official faculty profile and academic URLs on any university website worldwide."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    clean_name = re.sub(r"^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+", "", name.strip(), flags=re.IGNORECASE)
    inst_tokens = [t.lower() for t in re.findall(r"[a-zA-Z0-9]+", institution) if len(t) > 2]

    # Discover official institutional domain
    inst_domain_url = await _lookup_institution_domain(institution)
    domain_host = ""
    if inst_domain_url:
        domain_host = urllib.parse.urlparse(inst_domain_url).netloc.replace("www.", "")

    queries = []
    if domain_host:
        queries.append(f"site:{domain_host} {clean_name}")
        queries.append(f"site:{domain_host} {clean_name} faculty profile")
    queries.extend([
        f"{clean_name} {institution} faculty profile",
        f"{clean_name} {institution} {department}",
        f"{clean_name} {institution}"
    ])

    results = []
    async with httpx.AsyncClient(verify=False, timeout=10.0, follow_redirects=True, headers=headers) as client:
        for q in queries:
            try:
                resp = await client.post("https://lite.duckduckgo.com/lite/", data={"q": q})
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for a in soup.find_all("a"):
                        href = a.get("href", "")
                        target = ""
                        if "uddg=" in href:
                            target = urllib.parse.unquote(href.split("uddg=")[1].split("&")[0])
                        elif href.startswith("http"):
                            target = href

                        if target and target not in results:
                            is_academic_domain = any(tld in target.lower() for tld in [".edu", ".ac.in", ".ernet.in", ".ac.uk", ".edu.au", ".edu.sg", ".univ-", ".ac.", ".edu."])
                            matches_domain = domain_host and domain_host in target.lower()
                            matches_inst = any(tok in target.lower() for tok in inst_tokens)
                            if (is_academic_domain or matches_domain) and (matches_domain or matches_inst or "faculty" in target.lower() or "viewdetails" in target.lower() or "profile" in target.lower() or "people" in target.lower()):
                                results.append(target)
                                if len(results) >= 4:
                                    return results
            except Exception as e:
                logger.warning(f"Universal search engine note for '{q}': {e}")

    return results


def _find_avatar_in_soup(soup: BeautifulSoup, base_url: str) -> Optional[str]:
    """Find faculty profile photo img tag in institutional HTML."""
    for img in soup.find_all("img"):
        src = img.get("src") or ""
        alt = (img.get("alt") or "").lower()
        parent_class = " ".join(img.parent.get("class", [])).lower() if img.parent else ""
        if any(k in src.lower() or k in alt or k in parent_class for k in ["profile", "faculty", "photo", "avatar", "portrait", "staff"]):
            resolved = urllib.parse.urljoin(base_url, src)
            if resolved.startswith("http"):
                return resolved
    return None


def _get_default_avatar(name: str) -> str:
    """Generate professional academic avatar with initials."""
    slug = urllib.parse.quote(name.strip())
    return f"https://ui-avatars.com/api/?name={slug}&background=0D9488&color=ffffff&size=256&bold=true&font-size=0.4"


def _generate_heuristic_profile(
    name: str,
    institution: str,
    department: str,
    avatar_url: str,
    source_url: str,
    source_label: str,
    custom_parameters: Optional[List[Dict[str, Any]]] = None,
    topics: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Provide clean baseline profile with NO placeholders or fabricated records."""
    research_interests = topics[:6] if topics else []

    additional_data = {}
    if custom_parameters:
        for cp in custom_parameters:
            cid = cp.get("id") or "custom_param"
            additional_data[cid] = []

    bio_summary = ""
    if institution or department:
        bio_summary = f"Faculty member in the {department} at {institution or 'Academic Institution'}."
    if research_interests:
        bio_summary += f" Specializing in {', '.join(research_interests[:3])}."

    return {
        "bio": bio_summary,
        "avatar_url": avatar_url,
        "source_url": source_url,
        "source_name": source_label,
        "research_interests": research_interests,
        "experience": [],
        "education": [],
        "teaching": [],
        "mentoring": [],
        "projects": [],
        "patents": [],
        "institutional_service": [],
        "outreach": [],
        "additional_parameters": additional_data
    }


# ── Gemini Structured Data Extraction ─────────────────────────────────────────

async def _extract_with_gemini(
    scraped_text: str,
    name: str,
    institution: str,
    department: str,
    api_key: str,
) -> Optional[Dict[str, Any]]:
    """
    Use Gemini to extract structured academic profile data from raw crawled text.

    Returns a dict with keys: bio, research_interests, teaching, projects, patents,
    mentoring, institutional_service, outreach, education, experience.
    Returns None on failure so the caller falls back to regex heuristics.
    """
    if not scraped_text or len(scraped_text.strip()) < 50:
        return None

    # Trim to ~12 000 chars to stay inside token limits while keeping rich context
    text_snippet = scraped_text[:12000]

    prompt = f"""You are an academic data extraction assistant. Extract structured faculty profile
information from the raw webpage text below for the faculty member: {name} at {institution}, {department}.

Return ONLY a valid JSON object — no markdown fences, no explanation.

Schema (use null for missing fields, empty [] for missing lists):
{{
  "bio": "<2-3 sentence professional bio extracted verbatim or summarised from the page. null if not found>",
  "research_interests": ["<topic>", ...],
  "teaching": [
    {{"course_name": "...", "course_code": null, "level": null, "term": null, "year": null}}
  ],
  "projects": [
    {{"title": "...", "funding_agency": null, "amount_inr_lakhs": null, "role": null, "status": null, "year": null}}
  ],
  "patents": [
    {{"title": "...", "patent_no": null, "filing_year": null, "status": null, "country": null}}
  ],
  "mentoring": [
    {{"type": null, "count": null, "status": null, "description": "...", "year": null}}
  ],
  "institutional_service": [
    {{"role_name": "...", "body_or_committee": null, "year": null}}
  ],
  "outreach": [
    {{"activity_type": null, "title": "...", "venue": null, "year": null}}
  ],
  "education": [
    {{"degree": null, "institution": null, "year": null, "description": "..."}}
  ],
  "experience": [
    {{"designation": null, "organization": null, "year": null, "description": "..."}}
  ]
}}

Rules:
- Only include records with real evidence from the text. Do NOT invent data.
- For year fields use 4-digit integers (e.g. 2021) or null.
- For amount_inr_lakhs use a float in INR lakhs (e.g. 25.5) or null.
- Limit each array to at most 10 items.
- Keep all string values under 200 characters.

RAW TEXT:
{text_snippet}
"""

    async with httpx.AsyncClient(timeout=25.0) as client:
        for model in GEMINI_MODELS_FLASH:
            endpoint = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent?key={api_key}"
            )
            try:
                resp = await client.post(
                    endpoint,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.0,
                            "responseMimeType": "application/json",
                        },
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        continue
                    raw = candidates[0]["content"]["parts"][0].get("text", "").strip()
                    # Strip markdown fences if present
                    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
                    raw = re.sub(r"\s*```$", "", raw).strip()
                    # Find outermost JSON object
                    start = raw.find("{")
                    end = raw.rfind("}")
                    if start != -1 and end != -1:
                        parsed = json.loads(raw[start : end + 1])
                        logger.info(
                            f"Gemini extraction succeeded with {model} — "
                            f"tokens used: {data.get('usageMetadata', {}).get('totalTokenCount', '?')}"
                        )
                        return parsed
                else:
                    err = resp.json().get("error", {})
                    logger.warning(
                        f"Gemini extraction with {model} returned HTTP {resp.status_code}: "
                        f"{err.get('message', '')[:100]}"
                    )
            except json.JSONDecodeError as e:
                logger.warning(f"Gemini extraction JSON parse error with {model}: {e}")
            except Exception as e:
                logger.warning(f"Gemini extraction error with {model}: {e}")

    return None


def _merge_gemini_into_profile(
    profile: Dict[str, Any],
    gemini: Dict[str, Any],
    source_url: str,
    source_label: str,
) -> None:
    """
    Merge Gemini-extracted structured data into the profile dict in-place.
    Adds source_name / source_url to every record for traceability.
    Only replaces empty profile fields — never discards regex data.
    """
    # Bio: use Gemini's version if the profile bio is empty/generic
    gemini_bio = (gemini.get("bio") or "").strip()
    if gemini_bio and (not profile.get("bio") or len(profile.get("bio", "")) < 30):
        profile["bio"] = gemini_bio

    # Research interests: merge unique topics
    gemini_topics = [t for t in (gemini.get("research_interests") or []) if isinstance(t, str) and t.strip()]
    existing_topics = set(t.lower() for t in profile.get("research_interests", []))
    for topic in gemini_topics:
        if topic.lower() not in existing_topics:
            profile.setdefault("research_interests", []).append(topic)
            existing_topics.add(topic.lower())

    # Structured sections: append Gemini records, annotate with source, deduplicate
    section_key_fields: Dict[str, str] = {
        "teaching": "course_name",
        "projects": "title",
        "patents": "title",
        "mentoring": "description",
        "institutional_service": "role_name",
        "outreach": "title",
        "education": "description",
        "experience": "description",
    }

    for section, key_field in section_key_fields.items():
        gemini_items = gemini.get(section) or []
        if not isinstance(gemini_items, list):
            continue

        # Build dedup set from existing profile records
        existing_keys = set()
        for existing in profile.get(section, []):
            val = (existing.get(key_field) or "").lower().strip()
            if val:
                existing_keys.add(val[:60])

        for item in gemini_items:
            if not isinstance(item, dict):
                continue
            val = (item.get(key_field) or "").strip()
            if not val:
                continue
            dedup_key = val.lower()[:60]
            if dedup_key in existing_keys:
                continue  # Skip duplicate
            # Annotate with source
            item["source_name"] = source_label
            item["source_url"] = source_url
            profile.setdefault(section, []).append(item)
            existing_keys.add(dedup_key)


# ── Smart Faculty Crawler Orchestrator ─────────────────────────────────────────

async def search_and_crawl_faculty(
    name: str,
    institution: Optional[str] = None,
    department: Optional[str] = None,
    custom_url: Optional[str] = None,
    custom_parameters: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Intelligently discover and crawl official institutional websites and relevant pages
    for a faculty member.
    Uses Gemini ONLY to determine what website / URLs to crawl.
    Crawls official webpages, parses real sections with ZERO placeholders.
    """
    clean_name = re.sub(r"^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+", "", name.strip(), flags=re.IGNORECASE)
    inst_name = institution or ""
    dept_name = department or "Engineering & Technology"

    target_urls: List[str] = []
    if custom_url:
        target_urls.append(custom_url)

    # 1. Use Gemini ONLY to identify what official website/page URLs to crawl
    gemini_key = _clean_gemini_key()
    if gemini_key:
        try:
            gemini_urls = await _ask_gemini_for_institutional_urls(clean_name, inst_name, dept_name, gemini_key)
            for u in gemini_urls:
                if u not in target_urls:
                    target_urls.append(u)
        except Exception as e:
            logger.warning(f"Gemini URL discovery notice: {e}")

    # Fallback to search engine if no URLs found yet
    if not target_urls:
        search_urls = await _search_institutional_page(clean_name, inst_name, dept_name)
        for u in search_urls:
            if u not in target_urls:
                target_urls.append(u)

    scraped_text = ""
    discovered_avatar = None
    primary_source_url = target_urls[0] if target_urls else f"https://openalex.org"
    source_label = f"{inst_name} Official Portal" if inst_name else "Institutional Portal"
    discovered_topics: List[str] = []
    scraped_sections: Dict[str, List[Dict[str, Any]]] = {
        "teaching": [],
        "projects": [],
        "patents": [],
        "mentoring": [],
        "institutional_service": [],
        "outreach": [],
        "education": [],
        "experience": []
    }

    # 2. Crawl official institutional pages and relevant sub-pages
    async with httpx.AsyncClient(verify=False, timeout=12.0, follow_redirects=True) as client:
        # Check Apify Web Scraper if configured and primary URL available
        apify_token = _get_apify_token()
        if apify_token and target_urls:
            apify_text = await _crawl_with_apify(target_urls[0], apify_token)
            if apify_text:
                scraped_text += apify_text
                source_label = f"{inst_name} (via Apify)"

        # Special Stanford Profiles CAP proxy check if present
        for u in list(target_urls):
            if "profiles.stanford.edu" in u:
                slug_match = re.search(r"profiles\.stanford\.edu/([a-zA-Z0-9_\-]+)", u)
                if slug_match:
                    cap_id = slug_match.group(1)
                    try:
                        cap_resp = await client.get(f"https://profiles.stanford.edu/proxy/api/cap/profiles/{cap_id}", headers={"User-Agent": "Mozilla/5.0"})
                        if cap_resp.status_code == 200:
                            cap_data = cap_resp.json().get("data", {})
                            scraped_text += f"\nStanford Profile: {cap_data.get('displayName', clean_name)} - {cap_data.get('shortTitle', '')}\n"
                            if cap_data.get("coursesTaught"):
                                for c in cap_data.get("coursesTaught", []):
                                    scraped_sections["teaching"].append({
                                        "course_name": c.get("courseTitle") or c.get("title") or "Course",
                                        "course_code": c.get("courseSubject"),
                                        "level": None,
                                        "term": c.get("academicYear"),
                                        "duration_hours": None,
                                        "student_feedback_score": None,
                                        "year": _extract_year(str(c.get("academicYear") or "")),
                                        "source_name": "Stanford Profiles",
                                        "source_url": u
                                    })
                            if cap_data.get("patents"):
                                for pat in cap_data.get("patents", []):
                                    scraped_sections["patents"].append({
                                        "title": pat.get("title") or "Patent",
                                        "patent_no": pat.get("patentNumber"),
                                        "filing_year": pat.get("year") or _extract_year(str(pat.get("filingDate") or "")),
                                        "status": pat.get("status"),
                                        "country": pat.get("country") or "United States",
                                        "source_name": "Stanford Profiles",
                                        "source_url": u
                                    })
                    except Exception as err:
                        logger.warning(f"Stanford CAP API crawl notice: {err}")

        # Crawl each identified institutional page (up to 4 pages)
        pages_crawled = 0
        discovered_child_urls: List[str] = []

        for crawl_url in target_urls[:4]:
            try:
                resp = await client.get(crawl_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                if resp.status_code == 200:
                    pages_crawled += 1
                    soup = BeautifulSoup(resp.text, "html.parser")
                    if not discovered_avatar:
                        discovered_avatar = _find_avatar_in_soup(soup, crawl_url)

                    # Parse structured academic sections directly from HTML
                    parsed = _parse_academic_sections_from_html(soup, crawl_url, source_label)
                    for k, v in parsed.items():
                        if v:
                            scraped_sections[k].extend(v)

                    # Discover relevant child links on the same host (e.g., courses, research, lab, cv)
                    parsed_host = urllib.parse.urlparse(crawl_url).netloc
                    for a in soup.find_all("a", href=True):
                        link_href = a["href"].strip()
                        resolved_link = urllib.parse.urljoin(crawl_url, link_href)
                        link_host = urllib.parse.urlparse(resolved_link).netloc
                        if link_host == parsed_host and resolved_link not in target_urls and resolved_link not in discovered_child_urls:
                            link_lower = (link_href + " " + a.get_text()).lower()
                            if any(w in link_lower for w in ["course", "teaching", "project", "grant", "patent", "supervis", "research", "lab", "cv", "publication"]):
                                discovered_child_urls.append(resolved_link)

                    for s in soup(["script", "style", "nav", "footer"]):
                        s.extract()
                    text = soup.get_text(separator=" ", strip=True)
                    if len(text) > 200:
                        scraped_text += "\n" + text[:15000]
            except Exception as e:
                logger.warning(f"Failed to crawl institutional URL {crawl_url}: {e}")

        # Also crawl up to 2 relevant child pages discovered on the site
        for child_url in discovered_child_urls[:2]:
            try:
                resp = await client.get(child_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    parsed = _parse_academic_sections_from_html(soup, child_url, source_label)
                    for k, v in parsed.items():
                        if v:
                            scraped_sections[k].extend(v)
            except Exception as e:
                logger.warning(f"Failed to crawl child URL {child_url}: {e}")

        # Fallback to OpenAlex author details + topics if web crawl didn't return text
        if not scraped_text or len(scraped_text.strip()) < 100:
            try:
                oa_search_url = f"https://api.openalex.org/authors?search={urllib.parse.quote(clean_name)}"
                res = await client.get(oa_search_url, headers={"User-Agent": "mailto:admin@acadlens.edu"})
                if res.status_code == 200:
                    oa_data = res.json().get("results", [])
                    if oa_data:
                        author = oa_data[0]
                        affil = (author.get("last_known_institutions") or [{}])[0].get("display_name", inst_name)
                        topics = [t.get("display_name") for t in author.get("topics", [])[:10] if t.get("display_name")]
                        discovered_topics = topics
                        scraped_text += f"Faculty Name: {clean_name}\nInstitution: {affil}\nTopics: {', '.join(topics)}\n"
                        scraped_text += f"Works Count: {author.get('works_count')}\nCitations: {author.get('cited_by_count')}\n"
                        if not target_urls:
                            primary_source_url = author.get("id", f"https://openalex.org")
                            source_label = "OpenAlex Academic Directory"
            except Exception as e:
                logger.warning(f"OpenAlex author enrich error: {e}")

    # 3. Avatar
    if not discovered_avatar:
        discovered_avatar = _get_default_avatar(clean_name)

    # 4. Clean baseline profile with NO placeholders
    profile = _generate_heuristic_profile(
        clean_name, inst_name, dept_name, discovered_avatar,
        primary_source_url, source_label, custom_parameters, topics=discovered_topics
    )

    # Deduplicate and attach regex-parsed sections
    for k, items in scraped_sections.items():
        if items:
            seen_keys = set()
            unique_items = []
            for it in items:
                dedup_key = (it.get("course_name") or it.get("title") or it.get("role_name") or it.get("description") or "").lower()
                if dedup_key and dedup_key not in seen_keys:
                    seen_keys.add(dedup_key)
                    unique_items.append(it)
            profile[k] = unique_items

    # 5. Gemini Structured Extraction — runs on the full scraped_text and merges
    #    richer data on top of what regex heuristics already found.
    gemini_key = _clean_gemini_key()
    if gemini_key and scraped_text and len(scraped_text.strip()) > 80:
        try:
            gemini_extracted = await _extract_with_gemini(
                scraped_text, clean_name, inst_name, dept_name, gemini_key
            )
            if gemini_extracted:
                _merge_gemini_into_profile(
                    profile, gemini_extracted, primary_source_url, source_label
                )
                logger.info(
                    f"Gemini extraction merged for '{clean_name}': "
                    f"bio={'yes' if gemini_extracted.get('bio') else 'no'}, "
                    f"teaching={len(gemini_extracted.get('teaching') or [])}, "
                    f"projects={len(gemini_extracted.get('projects') or [])}, "
                    f"patents={len(gemini_extracted.get('patents') or [])}, "
                    f"experience={len(gemini_extracted.get('experience') or [])}, "
                    f"education={len(gemini_extracted.get('education') or [])}"
                )
        except Exception as e:
            logger.warning(f"Gemini extraction step failed (non-critical): {e}")

    return profile
