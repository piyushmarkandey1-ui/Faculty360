"""
Apify service for Google Scholar fetching.
"""
import re
from typing import Dict, Any
from apify_client import ApifyClient
from app.core.config import settings

def extract_scholar_id(url_or_id: str) -> str:
    """Extract Google Scholar ID from a URL or return as-is."""
    if "user=" in url_or_id:
        match = re.search(r"user=([^&]+)", url_or_id)
        if match:
            return match.group(1)
    # Just in case they pasted the whole URL without user= properly
    if "scholar.google" in url_or_id:
        return url_or_id.split("/")[-1].split("?")[0]
    return url_or_id

def fetch_scholar_data(scholar_url: str) -> Dict[str, Any]:
    """
    Fetch Scholar data from Apify using biscience/google-scholar-scraper.
    """
    client = ApifyClient(settings.APIFY_API_TOKEN)
    scholar_id = extract_scholar_id(scholar_url)
    
    run_input = {
        "authorIds": [scholar_id]
    }
    
    # Start the actor and wait for it to finish
    run = client.actor(settings.APIFY_GOOGLE_SCHOLAR_ACTOR_ID).call(run_input=run_input)
    
    # Fetch results from the run's default dataset
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
    
    if not items:
        raise ValueError(f"No data found for Scholar ID: {scholar_id}")
        
    # The output usually contains 'author' info and 'articles' array
    # If the scraper returns one item per author
    return items[0]
