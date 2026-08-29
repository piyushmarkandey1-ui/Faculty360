from .base import AcademicSourceConnector
from .google_scholar import GoogleScholarConnector
from .orcid import OrcidConnector
from .researchgate import ResearchGateConnector
from .institutional import InstitutionalDataConnector

def get_connector(source_type: str) -> AcademicSourceConnector:
    if source_type == "google_scholar":
        return GoogleScholarConnector()
    elif source_type == "orcid":
        return OrcidConnector()
    elif source_type == "researchgate":
        return ResearchGateConnector()
    elif source_type == "institutional":
        return InstitutionalDataConnector()
    else:
        raise ValueError(f"Unknown source type: {source_type}")
