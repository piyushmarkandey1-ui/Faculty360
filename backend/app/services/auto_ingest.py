import asyncio
import httpx
import logging
from typing import Dict, Any, List
from app.core.supabase import get_supabase_admin
from app.services.normalization import normalize_title, normalize_doi

logger = logging.getLogger(__name__)

async def auto_sync_faculty_publications(faculty_id: str, name: str, orcid_id: str = None, s2_id: str = None, scholar_id: str = None):
    """
    Automatically fetches and stores real publications for a newly imported faculty profile
    from OpenAlex and Semantic Scholar.
    """
    supabase = get_supabase_admin()
    pubs_to_insert = []
    sources_to_insert = []
    seen_titles = set()

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Fetch from OpenAlex by ORCID or Name
        try:
            if orcid_id:
                oa_url = f"https://api.openalex.org/works?filter=author.orcid:{orcid_id}&per_page=15"
            else:
                oa_url = f"https://api.openalex.org/works?search={name}&per_page=15"
            
            resp = await client.get(oa_url, headers={"User-Agent": "mailto:admin@faculty360.edu"})
            if resp.status_code == 200:
                data = resp.json()
                for work in data.get("results", []):
                    title = (work.get("title") or "").strip()
                    if not title or title.lower() in seen_titles:
                        continue
                    seen_titles.add(title.lower())

                    year = work.get("publication_year")
                    doi = work.get("doi")
                    cits = work.get("cited_by_count", 0) or 0
                    loc = work.get("primary_location") or {}
                    src = loc.get("source") or {}
                    venue = src.get("display_name") or "Journal / Conference"

                    norm_t = normalize_title(title)
                    norm_d = normalize_doi(doi)

                    pubs_to_insert.append({
                        "faculty_id": faculty_id,
                        "title": title,
                        "normalized_title": norm_t,
                        "year": year,
                        "venue": venue,
                        "doi": norm_d,
                        "citation_count": cits,
                        "source_type": "openalex",
                        "is_verified": True,
                        "dedup_status": "unique",
                        "confidence": 98.0
                    })
        except Exception as e:
            logger.warning(f"Auto-sync OpenAlex failed for {name}: {e}")

        # 2. If needed, supplement with Semantic Scholar author papers
        if len(pubs_to_insert) < 5 and s2_id:
            try:
                s2_url = f"https://api.semanticscholar.org/graph/v1/author/{s2_id}/papers?fields=title,year,venue,citationCount,externalIds&limit=10"
                s2_resp = await client.get(s2_url)
                if s2_resp.status_code == 200:
                    s2_data = s2_resp.json()
                    for p in s2_data.get("data", []):
                        title = (p.get("title") or "").strip()
                        if not title or title.lower() in seen_titles:
                            continue
                        seen_titles.add(title.lower())

                        year = p.get("year")
                        cits = p.get("citationCount", 0) or 0
                        venue = p.get("venue") or "Academic Proceedings"
                        ext_ids = p.get("externalIds") or {}
                        doi = ext_ids.get("DOI")

                        pubs_to_insert.append({
                            "faculty_id": faculty_id,
                            "title": title,
                            "normalized_title": normalize_title(title),
                            "year": year,
                            "venue": venue,
                            "doi": normalize_doi(doi),
                            "citation_count": cits,
                            "source_type": "semantic_scholar",
                            "is_verified": True,
                            "dedup_status": "unique",
                            "confidence": 95.0
                        })
            except Exception as e:
                logger.warning(f"Auto-sync Semantic Scholar failed for {s2_id}: {e}")

    # Insert into Supabase
    if pubs_to_insert:
        try:
            ins_res = supabase.table("publications").insert(pubs_to_insert).execute()
            if ins_res.data:
                for row in ins_res.data:
                    sources_to_insert.append({
                        "publication_id": row["id"],
                        "source_type": row.get("source_type", "openalex"),
                        "source_url": f"https://doi.org/{row['doi']}" if row.get("doi") else f"https://openalex.org",
                        "original_title": row["title"],
                        "original_year": row.get("year"),
                        "original_doi": row.get("doi")
                    })
                if sources_to_insert:
                    supabase.table("publication_sources").upsert(sources_to_insert, on_conflict="publication_id,source_type").execute()
            
            # Update last synced at
            supabase.table("faculty").update({"last_synced_at": "now()"}).eq("id", faculty_id).execute()
        except Exception as e:
            logger.error(f"Failed to insert publications into Supabase: {e}")
