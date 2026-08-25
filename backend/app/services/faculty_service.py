"""
Faculty service: handles DB operations and orchestrates syncs.
"""
import logging
from typing import Dict, Any
from app.core.supabase import get_supabase_admin
from app.services.apify_service import fetch_scholar_data

logger = logging.getLogger(__name__)

def sync_google_scholar(faculty_id: str, scholar_url: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    
    # 1. Fetch data from Apify
    try:
        data = fetch_scholar_data(scholar_url)
    except Exception as e:
        logger.error(f"Apify fetch failed for {faculty_id}: {e}")
        raise ValueError(f"Failed to fetch data from Google Scholar: {e}")

    # 2. Extract author stats
    author_info = data.get("author", {})
    name = author_info.get("name", "")
    h_index = author_info.get("hIndex", 0)
    total_citations = author_info.get("totalCitations", 0)
    
    articles = data.get("articles", [])
    
    # 3. Update academic_identities
    scholar_id = author_info.get("scholarId", scholar_url)
    identity_data = {
        "faculty_id": faculty_id,
        "source_type": "google_scholar",
        "external_id": scholar_id,
        "profile_url": f"https://scholar.google.com/citations?user={scholar_id}",
        "is_verified": True
    }
    
    # Upsert academic identity (assuming unique constraint on faculty_id, source_type)
    supabase.table("academic_identities").upsert(identity_data, on_conflict="faculty_id,source_type").execute()
    
    # 4. Process publications
    pubs_added = 0
    pubs_updated = 0
    
    # Fetch existing publications for dedup (naive matching)
    existing_pubs_res = supabase.table("publications").select("id, title, doi").eq("faculty_id", faculty_id).execute()
    existing_pubs = existing_pubs_res.data
    existing_titles = {p["title"].lower(): p for p in existing_pubs if p.get("title")}
    existing_dois = {p["doi"]: p for p in existing_pubs if p.get("doi")}
    
    for article in articles:
        title = article.get("title", "")
        if not title:
            continue
            
        year = article.get("year")
        try:
            year = int(year) if year else None
        except ValueError:
            year = None
            
        venue = article.get("publication", "")
        citation_count = article.get("citedBy", {}).get("count", 0)
        
        # Deduplication check
        match = None
        if title.lower() in existing_titles:
            match = existing_titles[title.lower()]
            
        pub_record = {
            "faculty_id": faculty_id,
            "title": title,
            "year": year,
            "venue": venue,
            "citation_count": citation_count,
            "source_type": "google_scholar",
            "is_verified": True,
            "dedup_status": "unique" if not match else "candidate"
        }
        
        if match:
            # Update existing
            pub_record["id"] = match["id"]
            supabase.table("publications").upsert(pub_record).execute()
            pubs_updated += 1
        else:
            # Insert new
            supabase.table("publications").insert(pub_record).execute()
            pubs_added += 1

    # Update faculty last_synced_at
    supabase.table("faculty").update({"last_synced_at": "now()"}).eq("id", faculty_id).execute()

    return {
        "source": "GOOGLE_SCHOLAR",
        "status": "completed",
        "publicationsFound": len(articles),
        "publicationsAdded": pubs_added,
        "publicationsUpdated": pubs_updated,
        "citations": total_citations,
        "hIndex": h_index
    }
