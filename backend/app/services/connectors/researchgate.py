from typing import Dict, Any
from app.services.connectors.base import AcademicSourceConnector

class ResearchGateConnector(AcademicSourceConnector):
    @property
    def source_type(self) -> str:
        return "researchgate"

    def validate(self, url_or_id: str) -> str:
        # Just return the URL or simple slug
        return url_or_id.strip()

    def fetch_and_normalize(self, identity: str) -> Dict[str, Any]:
        # Return integration pending as per instructions
        return {
            "status": "unavailable",
            "message": "Integration pending / authorized access required",
            "author": {
                "name": "",
                "external_id": identity,
                "profile_url": identity if identity.startswith("http") else f"https://www.researchgate.net/profile/{identity}",
                "h_index": 0,
                "total_citations": 0
            },
            "publications": []
        }
