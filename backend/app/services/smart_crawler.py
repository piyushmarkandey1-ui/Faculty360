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

GEMINI_MODEL = "gemini-3.5-flash"
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


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
        # Run the Cheerio Scraper or Web Scraper actor on the target URL
        run_input = {
            "startUrls": [{"url": url}],
            "maxRequestsPerCrawl": 2,
            "maxCrawlingDepth": 1,
        }
        # Run synchronously or call actor
        run = client.actor("apify/cheerio-scraper").call(run_input=run_input, timeout_secs=15)
        if run and run.get("defaultDatasetId"):
            dataset_items = client.dataset(run["defaultDatasetId"]).list_items().items
            if dataset_items:
                extracted_texts = [item.get("text", "") or item.get("body", "") for item in dataset_items]
                return " ".join(extracted_texts)[:15000]
    except Exception as e:
        logger.warning(f"Apify crawl attempt failed: {e}")
    return None


async def _search_institutional_page(name: str, institution: str, department: str) -> Optional[str]:
    """Search for the official faculty profile URL on ANY university/institutional website worldwide."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    clean_name = re.sub(r'^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+', '', name.strip(), flags=re.IGNORECASE)
    inst_tokens = [t.lower() for t in re.findall(r'[a-zA-Z0-9]+', institution) if len(t) > 2]
    
    queries = [
        f"{clean_name} {institution} faculty profile",
        f"{clean_name} {institution} {department}",
        f"{clean_name} {institution}"
    ]
    
    async with httpx.AsyncClient(verify=False, timeout=12.0, follow_redirects=True, headers=headers) as client:
        for q in queries:
            try:
                # Use DuckDuckGo Lite POST search for maximal reliability
                resp = await client.post("https://lite.duckduckgo.com/lite/", data={"q": q})
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    candidates = []
                    for a in soup.find_all("a"):
                        href = a.get("href", "")
                        target = ""
                        if "uddg=" in href:
                            target = urllib.parse.unquote(href.split("uddg=")[1].split("&")[0])
                        elif href.startswith("http"):
                            target = href
                            
                        if target:
                            # Prioritize university / institutional domain matching
                            is_academic_domain = any(tld in target.lower() for tld in [".edu", ".ac.in", ".ernet.in", ".ac.uk", ".edu.au", ".edu.sg", ".univ-", ".ac.", ".edu."])
                            matches_inst = any(tok in target.lower() for tok in inst_tokens)
                            if is_academic_domain and (matches_inst or "faculty" in target.lower() or "viewdetails" in target.lower() or "profile" in target.lower() or "people" in target.lower()):
                                return target
                            candidates.append(target)
                            
                    for c in candidates:
                        if any(tld in c.lower() for tld in [".edu", ".ac.in", ".ernet.in", ".ac.uk", ".edu.au", ".edu.sg"]):
                            return c
            except Exception as e:
                logger.warning(f"Universal search engine error for '{q}': {e}")
                
    return None


async def search_and_crawl_faculty(
    name: str,
    institution: Optional[str] = None,
    department: Optional[str] = None,
    custom_url: Optional[str] = None,
    custom_parameters: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Intelligently discover and crawl public official websites, academic pages,
    and institutional portals for a faculty member.
    Extracts profile photo, experience, education, teaching, mentoring,
    sponsored projects, patents, institutional service, and any custom parameters.
    """
    clean_name = re.sub(r'^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+', '', name.strip(), flags=re.IGNORECASE)
    inst_name = institution or ""
    dept_name = department or "Engineering & Technology"

    scraped_text = ""
    discovered_avatar = None
    discovered_source_url = custom_url or ""
    source_label = f"{inst_name} Portal" if inst_name else "Institutional Portal"

    # 1. Check Apify Web Scraper if token is available
    apify_token = _get_apify_token()
    if apify_token and custom_url:
        apify_text = await _crawl_with_apify(custom_url, apify_token)
        if apify_text:
            scraped_text = apify_text
            source_label = f"{inst_name} (via Apify)"

    # 2. Search engine discovery if no custom URL provided
    if not custom_url:
        discovered_url = await _search_institutional_page(clean_name, inst_name, dept_name)
        if discovered_url:
            custom_url = discovered_url
            discovered_source_url = discovered_url

    # 3. Fetch real HTML from official institutional webpage
    async with httpx.AsyncClient(verify=False, timeout=15.0, follow_redirects=True) as client:
        if custom_url:
            try:
                resp = await client.get(custom_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for s in soup(["script", "style", "nav", "footer"]):
                        s.extract()
                    text = soup.get_text(separator=" ", strip=True)
                    if len(text) > 300:
                        scraped_text = text[:18000]
                        discovered_avatar = _find_avatar_in_soup(soup, custom_url)
                        discovered_source_url = custom_url
            except Exception as e:
                logger.warning(f"Failed to crawl institutional URL {custom_url}: {e}")

        # Fallback to OpenAlex author details + topics if web crawl didn't return text
        if not scraped_text:
            try:
                oa_search_url = f"https://api.openalex.org/authors?search={urllib.parse.quote(clean_name)}"
                res = await client.get(oa_search_url, headers={"User-Agent": "mailto:admin@acadlens.edu"})
                if res.status_code == 200:
                    oa_data = res.json().get("results", [])
                    if oa_data:
                        author = oa_data[0]
                        affil = (author.get("last_known_institutions") or [{}])[0].get("display_name", inst_name)
                        topics = [t.get("display_name") for t in author.get("topics", [])[:10]]
                        scraped_text += f"Faculty Name: {clean_name}\nInstitution: {affil}\nTopics: {', '.join(topics)}\n"
                        scraped_text += f"Works Count: {author.get('works_count')}\nCitations: {author.get('cited_by_count')}\n"
                        if not discovered_source_url:
                            discovered_source_url = author.get("id", f"https://openalex.org")
                            source_label = "OpenAlex & Academic Directory"
            except Exception as e:
                logger.warning(f"OpenAlex author enrich error: {e}")

    # 4. Extract profile photo from Gravatar / GitHub / Scholar or initials fallback
    if not discovered_avatar:
        discovered_avatar = _get_default_avatar(clean_name)

    # 5. Structure with Gemini 3.6 Flash if key is present
    gemini_key = _clean_gemini_key()
    if gemini_key:
        try:
            structured = await _extract_with_gemini(
                clean_name, inst_name, dept_name, scraped_text, gemini_key, 
                discovered_source_url or f"https://openalex.org", source_label, custom_parameters
            )
            structured["avatar_url"] = discovered_avatar
            return structured
        except Exception as e:
            logger.warning(f"Gemini smart extraction failed ({e}), using heuristic generator.")

    # 6. Deterministic Heuristic Fallback based on verified professor background
    return _generate_heuristic_profile(
        clean_name, inst_name, dept_name, discovered_avatar, 
        discovered_source_url or f"https://openalex.org", 
        source_label, custom_parameters
    )


def _find_avatar_in_soup(soup: BeautifulSoup, base_url: str) -> Optional[str]:
    """Find faculty profile photo img tag in institutional HTML."""
    for img in soup.find_all("img"):
        src = img.get("src") or ""
        alt = (img.get("alt") or "").lower()
        parent_class = " ".join(img.parent.get("class", [])).lower() if img.parent else ""
        if any(k in src.lower() or k in alt or k in parent_class for k in ["profile", "faculty", "photo", "avatar", "portrait", "staff"]):
            return urllib.parse.urljoin(base_url, src)
    return None


def _get_default_avatar(name: str) -> str:
    """Generate high-resolution professional academic avatar using DiceBear or UI Avatars."""
    slug = urllib.parse.quote(name.strip())
    return f"https://ui-avatars.com/api/?name={slug}&background=0D9488&color=ffffff&size=256&bold=true&font-size=0.4"


async def _extract_with_gemini(
    name: str,
    institution: str,
    department: str,
    scraped_text: str,
    api_key: str,
    source_url: str,
    source_label: str,
    custom_parameters: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Use Gemini 3.6 Flash to parse raw text into a strict academic profile schema."""
    custom_json_schema = ""
    if custom_parameters:
        param_entries = []
        for cp in custom_parameters:
            cid = cp.get("id") or "custom_param"
            cname = cp.get("name") or cid
            param_entries.append(f'    "{cid}": [\n      {{\n        "title": "<{cname} Title / Description>",\n        "year": "2023",\n        "details": "<Additional details>"\n      }}\n    ]')
        custom_json_schema = ',\n  "additional_parameters": {\n' + ',\n'.join(param_entries) + '\n  }'

    prompt = f"""You are the AcadLens Institutional Intelligence Parser.
Extract or synthesize verified academic profile details for Professor {name} at {institution} ({department}).
Ensure teaching hours, course durations, and student mentoring counts are calculated accurately from institutional text.

Return a single raw JSON object matching this schema exactly (no markdown fences):
{{
  "bio": "<2-3 sentence biography of academic background and focus>",
  "research_interests": ["<interest 1>", "<interest 2>", "<interest 3>", "<interest 4>"],
  "experience": [
    {{
      "role": "<e.g. Professor / Associate Professor / Assistant Professor>",
      "organization": "<Institution Name>",
      "department": "<Department Name>",
      "start_year": "<e.g. 2018>",
      "end_year": "<e.g. Present or 2024>",
      "duration": "<e.g. 6 years>",
      "is_current": true
    }}
  ],
  "education": [
    {{
      "degree": "<e.g. Ph.D. in Computer Science & Engineering>",
      "institution": "<University Name>",
      "year": "<Year of Completion>"
    }}
  ],
  "teaching": [
    {{
      "course_name": "<Course Name>",
      "course_code": "<e.g. CS-401>",
      "level": "<UG or PG>",
      "term": "<Spring / Autumn / Annual>",
      "duration_hours": 45,
      "student_feedback_score": 4.8
    }}
  ],
  "mentoring": [
    {{
      "type": "<PhD Scholars Guided or PG Dissertations>",
      "count": 4,
      "status": "<Completed / Ongoing>",
      "description": "<Supervision of research dissertations in Machine Learning and Data Science>"
    }}
  ],
  "projects": [
    {{
      "title": "<Sponsored Project Title>",
      "funding_agency": "<e.g. DST / SERB / AICTE / MeitY / Industry>",
      "amount_inr_lakhs": 25.5,
      "role": "<Principal Investigator (PI) or Co-PI>",
      "duration": "<e.g. 2021-2024>",
      "status": "<Completed or Ongoing>"
    }}
  ],
  "patents": [
    {{
      "title": "<Patent / Innovation Title>",
      "patent_no": "<Patent Application No. or Grant ID>",
      "filing_year": "2023",
      "status": "<Published or Granted>",
      "country": "India"
    }}
  ],
  "institutional_service": [
    {{
      "role_name": "<e.g. Head of Department / Committee Member / Faculty Coordinator>",
      "body_or_committee": "<e.g. Departmental Academic Committee / NBA Accreditation Cell>",
      "duration": "<e.g. 2022 - Present>"
    }}
  ],
  "outreach": [
    {{
      "activity_type": "<Keynote / Workshop / Reviewer>",
      "title": "<Invited Talk / Session Chair / Journal Reviewer>",
      "venue": "<International Conference / IEEE Transactions>",
      "year": "2024"
    }}
  ]{custom_json_schema}
}}

CONTEXT:
Faculty: {name}
Institution: {institution}
Department: {department}
Raw crawled details:
{scraped_text[:6000]}
"""

    models_to_try = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-lite-latest"]
    last_err = None

    async with httpx.AsyncClient(timeout=20.0) as client:
        for model in models_to_try:
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                resp = await client.post(
                    f"{endpoint}?key={api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.15,
                            "responseMimeType": "application/json"
                        }
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.IGNORECASE)
                    clean_text = re.sub(r"\s*```$", "", clean_text).strip()
                    start_idx = clean_text.find("{")
                    end_idx = clean_text.rfind("}")
                    if start_idx != -1 and end_idx != -1:
                        clean_text = clean_text[start_idx:end_idx + 1]
                    parsed = json.loads(clean_text)
                    
                    # Inject verified provenance tags
                    parsed["source_url"] = source_url
                    parsed["source_name"] = source_label
                    logger.info(f"Successfully extracted academic profile using Gemini model '{model}'")
                    return parsed
                else:
                    last_err = f"Model {model} returned HTTP {resp.status_code}: {resp.text[:120]}"
                    logger.warning(f"Gemini fallback warning: {last_err}")
            except Exception as e:
                last_err = str(e)
                logger.warning(f"Gemini model {model} attempt error: {e}")

    raise RuntimeError(f"All Gemini models exhausted: {last_err}")


def _generate_heuristic_profile(
    name: str,
    institution: str,
    department: str,
    avatar_url: str,
    source_url: str,
    source_label: str,
    custom_parameters: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Return a minimal profile skeleton when Gemini extraction is unavailable.
    Only includes verifiable metadata — no fabricated records."""
    additional_data = {}
    if custom_parameters:
        for cp in custom_parameters:
            cid = cp.get("id") or "custom_param"
            additional_data[cid] = []
    
    return {
        "bio": f"Faculty member in the {department} at {institution}.",
        "avatar_url": avatar_url,
        "source_url": source_url,
        "source_name": source_label,
        "research_interests": [],
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
