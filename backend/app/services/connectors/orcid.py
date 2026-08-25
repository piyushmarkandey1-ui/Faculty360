import re
import httpx
from typing import Dict, Any
from app.services.connectors.base import AcademicSourceConnector

class OrcidConnector(AcademicSourceConnector):
    @property
    def source_type(self) -> str:
        return "orcid"

    def validate(self, url_or_id: str) -> str:
        # Extract XXXX-XXXX-XXXX-XXXX
        match = re.search(r"(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])", url_or_id)
        if match:
            return match.group(1)
        raise ValueError("Invalid ORCID format. Expected XXXX-XXXX-XXXX-XXXX")

    def fetch_and_normalize(self, identity: str) -> Dict[str, Any]:
        base_url = f"https://pub.orcid.org/v3.0/{identity}"
        headers = {"Accept": "application/json"}
        
        with httpx.Client() as client:
            # 1. Fetch Person (for name)
            person_resp = client.get(f"{base_url}/person", headers=headers)
            name = "Unknown"
            if person_resp.status_code == 200:
                pdata = person_resp.json()
                name_info = pdata.get("name", {})
                if name_info:
                    given = name_info.get("given-names", {}).get("value", "") if name_info.get("given-names") else ""
                    family = name_info.get("family-name", {}).get("value", "") if name_info.get("family-name") else ""
                    name = f"{given} {family}".strip()

            # 2. Fetch Works (publications)
            works_resp = client.get(f"{base_url}/works", headers=headers)
            if works_resp.status_code != 200:
                raise ValueError(f"Failed to fetch ORCID works: {works_resp.status_code}")
                
            works_data = works_resp.json()
            
        normalized_pubs = []
        for group in works_data.get("group", []):
            summary = group.get("work-summary", [])
            if not summary:
                continue
            work = summary[0] # take the first summary for this work
            
            title = work.get("title", {}).get("title", {}).get("value", "")
            if not title:
                continue
                
            year = None
            pub_date = work.get("publication-date")
            if pub_date and pub_date.get("year"):
                try:
                    year = int(pub_date["year"]["value"])
                except:
                    pass
                    
            # Extract DOI
            doi = None
            ext_ids = work.get("external-ids", {}).get("external-id", [])
            for eid in ext_ids:
                if eid.get("external-id-type") == "doi":
                    doi = eid.get("external-id-value")
                    break

            normalized_pubs.append({
                "title": title,
                "year": year,
                "venue": work.get("journal-title", {}).get("value") if work.get("journal-title") else "",
                "doi": doi,
                "citation_count": 0  # ORCID doesn't provide this natively in the basic API
            })
            
        return {
            "status": "completed",
            "author": {
                "name": name,
                "external_id": identity,
                "profile_url": f"https://orcid.org/{identity}",
                "h_index": 0,
                "total_citations": 0
            },
            "publications": normalized_pubs
        }
