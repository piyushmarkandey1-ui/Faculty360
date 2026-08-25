import re
from typing import Dict, Any
from apify_client import ApifyClient
from app.core.config import settings
from app.services.connectors.base import AcademicSourceConnector

class GoogleScholarConnector(AcademicSourceConnector):
    @property
    def source_type(self) -> str:
        return "google_scholar"

    def validate(self, url_or_id: str) -> str:
        if "user=" in url_or_id:
            match = re.search(r"user=([^&]+)", url_or_id)
            if match:
                return match.group(1)
        if "scholar.google" in url_or_id:
            return url_or_id.split("/")[-1].split("?")[0]
        return url_or_id

    def fetch_and_normalize(self, identity: str) -> Dict[str, Any]:
        client = ApifyClient(settings.APIFY_API_TOKEN)
        run_input = {"authorIds": [identity]}
        
        run = client.actor(settings.APIFY_GOOGLE_SCHOLAR_ACTOR_ID).call(run_input=run_input)
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        
        if not items:
            raise ValueError(f"No data found for Scholar ID: {identity}")
            
        data = items[0]
        
        author_info = data.get("author", {})
        scholar_id = author_info.get("scholarId", identity)
        
        normalized_pubs = []
        for article in data.get("articles", []):
            title = article.get("title", "")
            if not title:
                continue
            year = article.get("year")
            try:
                year = int(year) if year else None
            except ValueError:
                year = None
                
            normalized_pubs.append({
                "title": title,
                "year": year,
                "venue": article.get("publication", ""),
                "doi": None,
                "citation_count": article.get("citedBy", {}).get("count", 0)
            })
            
        return {
            "status": "completed",
            "author": {
                "name": author_info.get("name", ""),
                "external_id": scholar_id,
                "profile_url": f"https://scholar.google.com/citations?user={scholar_id}",
                "h_index": author_info.get("hIndex", 0),
                "total_citations": author_info.get("totalCitations", 0)
            },
            "publications": normalized_pubs
        }
