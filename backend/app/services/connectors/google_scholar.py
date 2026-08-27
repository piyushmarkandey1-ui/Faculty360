import re
import logging
from html import unescape
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.services.connectors.base import AcademicSourceConnector

try:
    from apify_client import ApifyClient
except ImportError:
    ApifyClient = None

logger = logging.getLogger(__name__)



class GoogleScholarConnector(AcademicSourceConnector):
    @property
    def source_type(self) -> str:
        return "google_scholar"

    def validate(self, url_or_id: str) -> str:
        cleaned = url_or_id.strip()
        if "user=" in cleaned:
            match = re.search(r"user=([^&]+)", cleaned)
            if match:
                return match.group(1).strip()
        if "scholar.google" in cleaned:
            parts = cleaned.rstrip("/").split("/")
            last_part = parts[-1].split("?")[0]
            if last_part and last_part != "citations":
                return last_part.strip()
        return cleaned

    def fetch_and_normalize(self, identity: str) -> Dict[str, Any]:
        """
        Fetches live academic data from Google Scholar using available real APIs/scrapers.
        Prioritizes:
          1. SerpApi Google Scholar Author API (if SERPAPI_API_KEY is configured)
          2. Apify Google Scholar Scraper (if APIFY_API_TOKEN is configured)
          3. Direct HTTP scraping (if no keys configured or public access available)
        No fake/mock fallbacks: returns real data or raises an explicit error.
        """
        errors: List[str] = []

        # 1. Try SerpApi if valid key is provided
        serp_key = (settings.SERPAPI_API_KEY or "").strip().strip('"').strip("'")
        if serp_key and serp_key not in ("demo", "undefined", "null", "none"):
            try:
                logger.info(f"Attempting SerpApi Google Scholar extraction for ID: {identity}")
                return self._fetch_serpapi(identity)
            except Exception as e:
                logger.warning(f"SerpApi fetch failed for {identity}: {e}")
                errors.append(f"SerpApi error: {str(e)}")

        # 2. Try Apify if valid token is provided
        apify_token = (settings.APIFY_API_TOKEN or "").strip().strip('"').strip("'")
        if apify_token and apify_token not in ("demo", "undefined", "null", "none"):
            try:
                logger.info(f"Attempting Apify Google Scholar extraction for ID: {identity}")
                return self._fetch_apify(identity)
            except Exception as e:
                logger.warning(f"Apify fetch failed for {identity}: {e}")
                errors.append(f"Apify error: {str(e)}")

        # 3. Try Direct Web Scraper
        try:
            logger.info(f"Attempting direct Google Scholar extraction for ID: {identity}")
            return self._fetch_direct_scrape(identity)
        except Exception as e:
            logger.warning(f"Direct Google Scholar scrape failed for {identity}: {e}")
            errors.append(f"Direct scrape error: {str(e)}")

        # If all real extraction attempts failed, raise descriptive error
        error_summary = " | ".join(errors) if errors else "No active provider succeeded"
        raise ValueError(
            f"Failed to fetch live Google Scholar data for ID '{identity}'. "
            f"{error_summary}. Please ensure the Scholar ID is valid and configure SERPAPI_API_KEY or APIFY_API_TOKEN in your .env file."
        )

    def _fetch_serpapi(self, scholar_id: str) -> Dict[str, Any]:
        """
        Fetches author profile and publications from SerpApi's google_scholar_author engine.
        """
        url = "https://serpapi.com/search.json"
        params = {
            "engine": "google_scholar_author",
            "author_id": scholar_id,
            "api_key": settings.SERPAPI_API_KEY,
            "num": 100
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, params=params)
            if resp.status_code != 200:
                error_msg = resp.text
                try:
                    error_json = resp.json()
                    error_msg = error_json.get("error", resp.text)
                except Exception:
                    pass
                raise ValueError(f"SerpApi returned status {resp.status_code}: {error_msg}")

            data = resp.json()

        author_info = data.get("author", {})
        if not author_info and not data.get("articles"):
            raise ValueError(f"No author data found on SerpApi for ID: {scholar_id}")

        author_name = author_info.get("name", "")
        profile_url = f"https://scholar.google.com/citations?user={scholar_id}"

        # Extract citation table metrics
        total_citations = 0
        h_index = 0
        cited_by_table = data.get("cited_by", {}).get("table", [])
        for row in cited_by_table:
            if "citations" in row:
                total_citations = int(row["citations"].get("all", 0) or 0)
            elif "h_index" in row:
                h_index = int(row["h_index"].get("all", 0) or 0)

        # Normalize articles
        normalized_pubs = []
        for article in data.get("articles", []):
            title = article.get("title", "").strip()
            if not title:
                continue

            year_val = article.get("year")
            year = None
            if year_val:
                try:
                    year = int(str(year_val).strip())
                except ValueError:
                    year = None

            cites_info = article.get("cited_by", {})
            citation_count = 0
            if isinstance(cites_info, dict):
                citation_count = int(cites_info.get("value", 0) or 0)
            elif isinstance(cites_info, (int, str)) and str(cites_info).isdigit():
                citation_count = int(cites_info)

            normalized_pubs.append({
                "title": title,
                "year": year,
                "venue": article.get("publication", "") or article.get("authors", ""),
                "doi": None,
                "citation_count": citation_count
            })

        return {
            "status": "completed",
            "author": {
                "name": author_name,
                "external_id": scholar_id,
                "profile_url": profile_url,
                "h_index": h_index,
                "total_citations": total_citations
            },
            "publications": normalized_pubs
        }

    def _fetch_apify(self, scholar_id: str) -> Dict[str, Any]:
        """
        Fetches Google Scholar profile using the Apify actor via direct REST API or client.
        """
        if not settings.APIFY_API_TOKEN or settings.APIFY_API_TOKEN == "demo":
            raise ValueError("APIFY_API_TOKEN is not configured.")

        profile_url = f"https://scholar.google.com/citations?user={scholar_id}"
        run_input = {
            "authorIds": [scholar_id],
            "startUrls": [{"url": profile_url}],
            "keyword": scholar_id,
            "search_keyword": scholar_id,
            "maxItems": 100
        }

        actor_id = settings.APIFY_GOOGLE_SCHOLAR_ACTOR_ID or "marco.gullo/google-scholar-scraper"
        clean_actor_id = actor_id.replace("/", "~")
        headers = {"Authorization": f"Bearer {settings.APIFY_API_TOKEN}"}

        with httpx.Client(timeout=60.0) as client:
            run_url = f"https://api.apify.com/v2/acts/{clean_actor_id}/run-sync-get-dataset-items?timeout=45"
            resp = client.post(run_url, headers=headers, json=run_input)
            if resp.status_code not in (200, 201):
                run_url_async = f"https://api.apify.com/v2/acts/{clean_actor_id}/runs"
                resp_async = client.post(run_url_async, headers=headers, json=run_input)
                if resp_async.status_code not in (200, 201):
                    raise ValueError(f"Apify actor call failed ({resp_async.status_code}): {resp_async.text[:200]}")
                run_data = resp_async.json().get("data", {})
                dataset_id = run_data.get("defaultDatasetId")
                if not dataset_id:
                    raise ValueError("Apify run did not return dataset ID")
                import time
                time.sleep(6)
                ds_resp = client.get(f"https://api.apify.com/v2/datasets/{dataset_id}/items", headers=headers)
                items = ds_resp.json() if ds_resp.status_code == 200 else []
            else:
                items = resp.json()

        if not items or not isinstance(items, list):
            raise ValueError(f"No items returned from Apify for Scholar ID: {scholar_id}")

        normalized_pubs = []
        author_name = ""
        h_index = 0
        total_citations = 0

        first_item = items[0] if items else {}
        if "author" in first_item and isinstance(first_item["author"], dict):
            author_info = first_item["author"]
            author_name = author_info.get("name", "")
            h_index = int(author_info.get("hIndex", 0) or 0)
            total_citations = int(author_info.get("totalCitations", 0) or 0)
            article_list = first_item.get("articles", [])
        else:
            article_list = items

        for article in article_list:
            if not isinstance(article, dict):
                continue
            title = (article.get("title") or article.get("article_title") or "").strip()
            if not title:
                continue

            year_val = article.get("year") or article.get("publication_year")
            try:
                year = int(year_val) if year_val else None
            except (ValueError, TypeError):
                year = None

            cites = article.get("citedBy") or article.get("citations") or article.get("cited_by", 0)
            if isinstance(cites, dict):
                citation_count = int(cites.get("count") or cites.get("value") or 0)
            elif str(cites).isdigit():
                citation_count = int(cites)
            else:
                citation_count = 0

            normalized_pubs.append({
                "title": title,
                "year": year,
                "venue": article.get("publication") or article.get("venue") or article.get("journal", ""),
                "doi": None,
                "citation_count": citation_count
            })

        return {
            "status": "completed",
            "author": {
                "name": author_name,
                "external_id": scholar_id,
                "profile_url": profile_url,
                "h_index": h_index,
                "total_citations": total_citations
            },
            "publications": normalized_pubs
        }


    def _fetch_direct_scrape(self, scholar_id: str) -> Dict[str, Any]:
        """
        Direct live HTTP extraction from public Google Scholar profile pages.
        """
        url = f"https://scholar.google.com/citations?user={scholar_id}&hl=en&cstart=0&pagesize=100"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        with httpx.Client(timeout=20.0) as client:
            resp = client.get(url, headers=headers, follow_redirects=True)
            if resp.status_code == 404:
                raise ValueError(f"Google Scholar profile '{scholar_id}' not found (404)")
            if resp.status_code != 200:
                raise ValueError(f"Google Scholar returned status {resp.status_code}")

            html = resp.text

        # Detect captcha or blocking
        if "recaptcha" in html.lower() or "unusual traffic" in html.lower():
            raise ValueError("Google Scholar anti-scraping CAPTCHA triggered. Please use SERPAPI_API_KEY.")

        name_m = re.search(r'<div id="gsc_prf_in">([^<]+)</div>', html)
        if not name_m:
            raise ValueError(f"Could not parse author name from Google Scholar profile for ID '{scholar_id}'")

        name = unescape(name_m.group(1)).strip()

        # Parse citation indices
        indices = re.findall(r'<td class="gsc_rsb_std">([^<]+)</td>', html)
        total_citations = int(indices[0].replace(",", "")) if len(indices) > 0 and indices[0].replace(",", "").isdigit() else 0
        h_index = int(indices[2].replace(",", "")) if len(indices) > 2 and indices[2].replace(",", "").isdigit() else 0

        # Parse publication rows
        rows = re.findall(r'<tr class="gsc_a_tr">([\s\S]*?)</tr>', html)
        normalized_pubs = []

        for row in rows:
            title_m = re.search(r'<a[^>]*class="gsc_a_at"[^>]*>([\s\S]*?)</a>', row)
            title = unescape(re.sub(r"<[^>]+>", "", title_m.group(1))).strip() if title_m else ""
            if not title:
                continue

            divs = re.findall(r'<div class="gs_gray">([\s\S]*?)</div>', row)
            venue = unescape(re.sub(r"<[^>]+>", "", divs[1])).strip() if len(divs) > 1 else (unescape(re.sub(r"<[^>]+>", "", divs[0])).strip() if len(divs) > 0 else "")

            cites_m = re.search(r'<a[^>]*class="gsc_a_ac[^"]*"[^>]*>([\s\S]*?)</a>', row)
            cites_str = cites_m.group(1).strip().replace(",", "") if cites_m else ""
            citation_count = int(cites_str) if cites_str.isdigit() else 0

            year_m = re.search(r'<span[^>]*class="gsc_a_h[^"]*"[^>]*>([\s\S]*?)</span>', row)
            year_str = year_m.group(1).strip() if year_m else ""
            year = int(year_str) if year_str.isdigit() else None

            normalized_pubs.append({
                "title": title,
                "year": year,
                "venue": venue,
                "doi": None,
                "citation_count": citation_count
            })

        if not normalized_pubs and not name:
            raise ValueError(f"No publications or author profile extracted for ID: {scholar_id}")

        return {
            "status": "completed",
            "author": {
                "name": name,
                "external_id": scholar_id,
                "profile_url": f"https://scholar.google.com/citations?user={scholar_id}",
                "h_index": h_index,
                "total_citations": total_citations
            },
            "publications": normalized_pubs
        }

