"""
Faculty service: handles DB operations and orchestrates syncs across connectors.
"""
import logging
from typing import Dict, Any
from app.core.supabase import get_supabase_admin
from app.services.connectors import get_connector

logger = logging.getLogger(__name__)

def sync_source(faculty_id: str, source_type: str, url_or_id: str) -> Dict[str, Any]:
    supabase = get_supabase_admin()
    connector = get_connector(source_type)
    
    # 1. Validate
    try:
        identity = connector.validate(url_or_id)
    except ValueError as e:
        raise ValueError(f"Validation failed: {e}")

    # 2. Fetch and Normalize
    try:
        result = connector.fetch_and_normalize(identity)
    except Exception as e:
        logger.error(f"{source_type} fetch failed for {faculty_id}: {e}")
        raise ValueError(f"Failed to fetch data from {source_type}: {e}")

    if result["status"] == "unavailable":
        return {
            "source": source_type,
            "status": "unavailable",
            "message": result.get("message", "Source unavailable")
        }

    author_info = result["author"]
    publications = result["publications"]
    
    # 3. Update academic_identities
    identity_data = {
        "faculty_id": faculty_id,
        "source_type": source_type,
        "external_id": author_info["external_id"],
        "profile_url": author_info["profile_url"],
        "is_verified": True
    }
    supabase.table("academic_identities").upsert(identity_data, on_conflict="faculty_id,source_type").execute()
    
    # 4. Process publications
    pubs_added = 0
    pubs_updated = 0
    
    existing_pubs_res = supabase.table("publications").select("id, title, doi").eq("faculty_id", faculty_id).execute()
    existing_pubs = existing_pubs_res.data
    existing_titles = {p["title"].lower(): p for p in existing_pubs if p.get("title")}
    existing_dois = {p["doi"]: p for p in existing_pubs if p.get("doi")}
    
    for article in publications:
        title = article["title"]
        doi = article.get("doi")
        
        # Deduplication check
        match = None
        if doi and doi in existing_dois:
            match = existing_dois[doi]
        elif title.lower() in existing_titles:
            match = existing_titles[title.lower()]
            
        pub_record = {
            "faculty_id": faculty_id,
            "title": title,
            "year": article.get("year"),
            "venue": article.get("venue"),
            "doi": doi,
            "citation_count": article.get("citation_count", 0),
            "source_type": source_type,
            "is_verified": True,
            "dedup_status": "unique" if not match else "candidate"
        }
        
        if match:
            pub_record["id"] = match["id"]
            supabase.table("publications").upsert(pub_record).execute()
            pubs_updated += 1
        else:
            supabase.table("publications").insert(pub_record).execute()
            pubs_added += 1

    # Update faculty last_synced_at
    supabase.table("faculty").update({"last_synced_at": "now()"}).eq("id", faculty_id).execute()

    return {
        "source": source_type,
        "status": "completed",
        "publicationsFound": len(publications),
        "publicationsAdded": pubs_added,
        "publicationsUpdated": pubs_updated,
        "citations": author_info["total_citations"],
        "hIndex": author_info["h_index"]
    }
