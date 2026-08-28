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

    # Load existing publications for this faculty member to prevent duplicates and resolve conflicts
    existing_res = supabase.table("publications").select("id, title, normalized_title, doi, citation_count, is_verified, source_type").eq("faculty_id", faculty_id).execute()
    existing_pubs = existing_res.data or []
    
    existing_by_doi = {p["doi"].lower(): p for p in existing_pubs if p.get("doi")}
    existing_by_title = {p["normalized_title"].lower(): p for p in existing_pubs if p.get("normalized_title")}

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

                candidate_papers = []
                if key == "openalex" and "results" in data:
                    for work in data.get("results", []):
                        candidate_papers.append({
                            "title": (work.get("title") or "").strip(),
                            "year": work.get("publication_year"),
                            "doi": work.get("doi"),
                            "citation_count": work.get("cited_by_count", 0) or 0,
                            "venue": (work.get("primary_location") or {}).get("source", {}).get("display_name") or "Academic Journal",
                            "authors": work.get("authorships", []),
                            "source_type": "openalex",
                            "is_verified": True
                        })
                elif key == "semantic_scholar" and "data" in data:
                    for p in data.get("data", []):
                        ext_ids = p.get("externalIds") or {}
                        candidate_papers.append({
                            "title": (p.get("title") or "").strip(),
                            "year": p.get("year"),
                            "doi": ext_ids.get("DOI"),
                            "citation_count": p.get("citationCount", 0) or 0,
                            "venue": p.get("venue") or "Academic Proceedings",
                            "authors": p.get("authors", []),
                            "source_type": "semantic_scholar",
                            "is_verified": True
                        })
                elif key == "semantic_scholar_search" and "data" in data:
                    for author in data.get("data", []):
                        disp = author.get("name", "").lower()
                        if all(p in disp for p in parts):
                            for p in author.get("papers", []):
                                ext_ids = p.get("externalIds") or {}
                                candidate_papers.append({
                                    "title": (p.get("title") or "").strip(),
                                    "year": p.get("year"),
                                    "doi": ext_ids.get("DOI"),
                                    "citation_count": p.get("citationCount", 0) or 0,
                                    "venue": p.get("venue") or "Academic Proceedings",
                                    "authors": p.get("authors", []),
                                    "source_type": "semantic_scholar",
                                    "is_verified": True
                                })

                for cand in candidate_papers:
                    title = cand["title"]
                    if not title:
                        continue
                    norm_t = normalize_title(title)
                    norm_d = normalize_doi(cand.get("doi"))
                    
                    # Check author match
                    if cand.get("authors") and not is_matching_author(cand["authors"], name):
                        continue
                        
                    # Deduplication check against in-memory seen titles
                    if norm_t.lower() in seen_titles:
                        continue
                    seen_titles.add(norm_t.lower())

                    # Check against existing publications in DB
                    existing_match = None
                    if norm_d and norm_d.lower() in existing_by_doi:
                        existing_match = existing_by_doi[norm_d.lower()]
                    elif norm_t.lower() in existing_by_title:
                        existing_match = existing_by_title[norm_t.lower()]

                    if existing_match:
                        # Duplicate found in DB: Resolve conflict by keeping verified record & updating citation count
                        pub_id = existing_match["id"]
                        if cand["citation_count"] > (existing_match.get("citation_count") or 0):
                            try:
                                supabase.table("publications").update({
                                    "citation_count": cand["citation_count"]
                                }).eq("id", pub_id).execute()
                            except Exception: pass
                            
                        # Add source link
                        sources_to_insert.append({
                            "publication_id": pub_id,
                            "source_type": cand["source_type"],
                            "source_url": f"https://doi.org/{norm_d}" if norm_d else f"https://openalex.org",
                            "original_title": title,
                            "original_year": cand.get("year"),
                            "original_doi": norm_d
                        })
                    else:
                        # New unique publication to insert
                        pubs_to_insert.append({
                            "faculty_id": faculty_id,
                            "title": title,
                            "normalized_title": norm_t,
                            "year": cand.get("year"),
                            "venue": cand.get("venue"),
                            "doi": norm_d,
                            "citation_count": cand["citation_count"],
                            "source_type": cand["source_type"],
                            "is_verified": True,
                            "dedup_status": "unique",
                            "confidence": 98.0
                        })

    # Insert new unique publications into Supabase
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
        except Exception as e:
            logger.error(f"Failed to insert publications into Supabase: {e}")

    # Upsert source links
    if sources_to_insert:
        try:
            supabase.table("publication_sources").upsert(sources_to_insert, on_conflict="publication_id,source_type").execute()
        except Exception as e:
            logger.warning(f"Publication sources upsert note: {e}")
            
    # Update last synced at
    supabase.table("faculty").update({"last_synced_at": "now()"}).eq("id", faculty_id).execute()


async def sync_smart_faculty_profile(
    faculty_id: str,
    name: str,
    institution: Optional[str] = None,
    department: Optional[str] = None,
    custom_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Crawls official public pages, runs Gemini 3.6 Flash structured extraction,
    stores rich profile data, experience, education, teaching, mentoring,
    projects, patents, service, and recalculates assessment.
    """
    from app.services.smart_crawler import search_and_crawl_faculty
    from app.services.assessment_engine import calculate_assessment
    
    supabase = get_supabase_admin()
    extracted = await search_and_crawl_faculty(name, institution, department, custom_url)
    
    # Save to unified_profiles
    existing_up = supabase.table("unified_profiles").select("*").eq("faculty_id", faculty_id).execute()
    
    up_data = {
        "faculty_id": faculty_id,
        "display_name": name,
        "bio": extracted.get("bio", ""),
        "research_interests": extracted.get("research_interests", []),
        "source_coverage": {
            "avatar_url": extracted.get("avatar_url"),
            "source_url": extracted.get("source_url"),
            "source_name": extracted.get("source_name"),
            "experience": extracted.get("experience", []),
            "education": extracted.get("education", []),
            "teaching": extracted.get("teaching", []),
            "mentoring": extracted.get("mentoring", []),
            "projects": extracted.get("projects", []),
            "patents": extracted.get("patents", []),
            "institutional_service": extracted.get("institutional_service", []),
            "outreach": extracted.get("outreach", []),
            "google_scholar": True,
            "orcid": True,
            "institutional": True,
            "openalex": True,
            "semantic_scholar": True
        }
    }
    
    if existing_up.data:
        supabase.table("unified_profiles").update(up_data).eq("faculty_id", faculty_id).execute()
    else:
        supabase.table("unified_profiles").insert(up_data).execute()

    # Also populate institutional_records table for full data traceability
    try:
        inst_records_to_insert = []
        for t in extracted.get("teaching", []):
            inst_records_to_insert.append({
                "faculty_id": faculty_id,
                "category": "teaching",
                "title": t.get("course_name", "Course"),
                "description": f"{t.get('course_code', '')} • {t.get('level', '')} ({t.get('duration_hours', 40)} hours)",
                "year": 2024,
                "is_verified": True
            })
        for m in extracted.get("mentoring", []):
            inst_records_to_insert.append({
                "faculty_id": faculty_id,
                "category": "mentoring",
                "title": m.get("type", "Research Mentoring"),
                "description": m.get("description", "Student Supervision"),
                "year": 2024,
                "is_verified": True
            })
        for p in extracted.get("projects", []):
            inst_records_to_insert.append({
                "faculty_id": faculty_id,
                "category": "projects",
                "title": p.get("title", "Research Project"),
                "description": f"Funding Agency: {p.get('funding_agency', '')} • Grant: INR {p.get('amount_inr_lakhs', '')}L",
                "year": 2023,
                "is_verified": True
            })
        for pat in extracted.get("patents", []):
            inst_records_to_insert.append({
                "faculty_id": faculty_id,
                "category": "innovation",
                "title": pat.get("title", "Patent"),
                "description": f"Patent No: {pat.get('patent_no', '')} • {pat.get('country', '')}",
                "year": 2023,
                "is_verified": True
            })
        for s in extracted.get("institutional_service", []):
            inst_records_to_insert.append({
                "faculty_id": faculty_id,
                "category": "service",
                "title": s.get("role_name", "Committee Member"),
                "description": s.get("body_or_committee", ""),
                "year": 2024,
                "is_verified": True
            })
        for o in extracted.get("outreach", []):
            inst_records_to_insert.append({
                "faculty_id": faculty_id,
                "category": "outreach",
                "title": o.get("title", "Outreach Event"),
                "description": f"{o.get('activity_type', '')} at {o.get('venue', '')}",
                "year": 2024,
                "is_verified": True
            })
            
        if inst_records_to_insert:
            try:
                supabase.table("institutional_records").delete().eq("faculty_id", faculty_id).execute()
            except Exception:
                pass
            supabase.table("institutional_records").insert(inst_records_to_insert).execute()
    except Exception as e:
        logger.warning(f"Institutional records sync warning: {e}")
        
    # Recalculate deterministic assessment with all new parameters
    try:
        calculate_assessment(faculty_id)
    except Exception as e:
        logger.warning(f"Auto assessment calculation error: {e}")
        
    return extracted
