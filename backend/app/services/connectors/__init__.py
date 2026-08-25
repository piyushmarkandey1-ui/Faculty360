from .base import AcademicSourceConnector
from .google_scholar import GoogleScholarConnector
from .orcid import OrcidConnector
from .researchgate import ResearchGateConnector

def get_connector(source_type: str) -> AcademicSourceConnector:
    if source_type == "google_scholar":
        return GoogleScholarConnector()
    elif source_type == "orcid":
        return OrcidConnector()
    elif source_type == "researchgate":
        return ResearchGateConnector()
    else:
        raise ValueError(f"Unknown source type: {source_type}")
