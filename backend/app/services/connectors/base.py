from abc import ABC, abstractmethod
from typing import Dict, Any

class AcademicSourceConnector(ABC):
    @property
    @abstractmethod
    def source_type(self) -> str:
        """Return the AcadLens source_type string."""
        pass

    @abstractmethod
    def validate(self, url_or_id: str) -> str:
        """Validate input and return the canonical ID or URL."""
        pass

    @abstractmethod
    def fetch_and_normalize(self, identity: str) -> Dict[str, Any]:
        """
        Fetch data and normalize to the standard AcadLens format:
        {
            "status": "completed" | "unavailable" | "failed",
            "message": str (optional),
            "author": {
                "name": str,
                "external_id": str,
                "profile_url": str,
                "h_index": int,
                "total_citations": int,
            },
            "publications": [
                {
                    "title": str,
                    "year": int,
                    "venue": str,
                    "doi": str,
                    "citation_count": int
                }
            ]
        }
        """
        pass
