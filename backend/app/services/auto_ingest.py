import asyncio
import httpx
import logging
import re
from typing import Dict, Any, List, Optional
from app.core.supabase import get_supabase_admin
from app.services.normalization import normalize_title, normalize_doi

logger = logging.getLogger(__name__)

def is_matching_author(authorships: list, target_name: str) -> bool:
    """Check if the paper's authors list contains the target professor's full name."""
    target_clean = re.sub(r'^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+', '', target_name.strip(), flags=re.IGNORECASE)
    parts = [p.lower() for p in target_clean.split() if len(p) > 1]
    if not parts:
        return True
    for auth in authorships:
        author_name = ""
        if isinstance(auth, dict):
            author_name = (auth.get("author", {}).get("display_name") or auth.get("raw_author_name") or auth.get("name") or "").lower()
        elif isinstance(auth, str):
            author_name = auth.lower()
        if all(part in author_name for part in parts):
            return True
    return False

async def auto_sync_faculty_publications(
    faculty_id: str,
    name: str,
    orcid_id: Optional[str] = None,
    s2_id: Optional[str] = None,
    scholar_id: Optional[str] = None,
    openalex_id: Optional[str] = None,
    affiliation: Optional[str] = None
):
    """
    Rapidly and accurately fetches and stores real publications for a faculty profile
    from OpenAlex and Semantic Scholar into Supabase with author disambiguation.
    """
    supabase = get_supabase_admin()
    pubs_to_insert = []
    sources_to_insert = []
    seen_titles = set()
    
    target_clean = re.sub(r'^(dr\.?|prof\.?|mr\.?|ms\.?|mrs\.?)\s+', '', name.strip(), flags=re.IGNORECASE)
    parts = [p.lower() for p in target_clean.split() if len(p) > 1]

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Resolve OpenAlex Author ID if not provided
        resolved_oa_id = openalex_id
        if not resolved_oa_id and not orcid_id:
            try:
                oa_search_url = f"https://api.openalex.org/authors?search={name}"
                res = await client.get(oa_search_url, headers={"User-Agent": "mailto:admin@faculty360.edu"})
                if res.status_code == 200:
                    authors = res.json().get("results", [])
                    for a in authors:
                        disp = a.get("display_name", "").lower()
                        if all(p in disp for p in parts):
                            resolved_oa_id = a.get("id", "").replace("https://openalex.org/", "")
                            break
            except Exception as e:
                logger.warning(f"OpenAlex author search error: {e}")

        tasks = []

        # OpenAlex task
        if orcid_id:
            oa_url = f"https://api.openalex.org/works?filter=author.orcid:{orcid_id}&per_page=35"
            tasks.append(("openalex", client.get(oa_url, headers={"User-Agent": "mailto:admin@faculty360.edu"})))
        elif resolved_oa_id:
            oa_url = f"https://api.openalex.org/works?filter=author.id:{resolved_oa_id}&per_page=35"
            tasks.append(("openalex", client.get(oa_url, headers={"User-Agent": "mailto:admin@faculty360.edu"})))

        # Semantic Scholar task
        if s2_id:
            s2_url = f"https://api.semanticscholar.org/graph/v1/author/{s2_id}/papers?fields=title,year,venue,citationCount,externalIds,authors&limit=30"
            tasks.append(("semantic_scholar", client.get(s2_url)))
        else:
            s2_search_url = f"https://api.semanticscholar.org/graph/v1/author/search?query={name}&fields=name,papers.title,papers.year,papers.venue,papers.citationCount,papers.externalIds,papers.authors&limit=5"
            tasks.append(("semantic_scholar_search", client.get(s2_search_url)))

        if tasks:
            task_keys = [t[0] for t in tasks]
            task_futures = [t[1] for t in tasks]
            responses = await asyncio.gather(*task_futures, return_exceptions=True)

            for key, resp in zip(task_keys, responses):
                if isinstance(resp, Exception) or resp.status_code != 200:
                    continue

                data = resp.json()

                if key == "openalex" and "results" in data:
                    for work in data.get("results", []):
                        title = (work.get("title") or "").strip()
                        if not title or title.lower() in seen_titles:
                            continue
                        
                        # Verify authorship
                        authorships = work.get("authorships", [])
                        if authorships and not is_matching_author(authorships, name):
                            continue

                        seen_titles.add(title.lower())
                        year = work.get("publication_year")
                        doi = work.get("doi")
                        cits = work.get("cited_by_count", 0) or 0
                        loc = work.get("primary_location") or {}
                        src = loc.get("source") or {}
                        venue = src.get("display_name") or "Academic Journal / Conference"

                        pubs_to_insert.append({
                            "faculty_id": faculty_id,
                            "title": title,
                            "normalized_title": normalize_title(title),
                            "year": year,
                            "venue": venue,
                            "doi": normalize_doi(doi),
                            "citation_count": cits,
                            "source_type": "openalex",
                            "is_verified": True,
                            "dedup_status": "unique",
                            "confidence": 98.0
                        })

                elif key == "semantic_scholar" and "data" in data:
                    for p in data.get("data", []):
                        title = (p.get("title") or "").strip()
                        if not title or title.lower() in seen_titles:
                            continue
                        
                        authors = p.get("authors", [])
                        if authors and not is_matching_author(authors, name):
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

                elif key == "semantic_scholar_search" and "data" in data:
                    for author in data.get("data", []):
                        disp = author.get("name", "").lower()
                        if all(p in disp for p in parts):
                            for p in author.get("papers", []):
                                title = (p.get("title") or "").strip()
                                if not title or title.lower() in seen_titles:
                                    continue
                                
                                authors = p.get("authors", [])
                                if authors and not is_matching_author(authors, name):
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
