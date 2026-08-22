# AcadLens — Data Sources & Ingestion Architecture

---

## 1. Design Principles

- **Source data is never mutated** — raw payloads are preserved in `source_records.raw_data`
- **Normalization is a separate step** — raw → unified is always traceable and re-runnable
- **Every claim has provenance** — every field in a unified profile links to the source record and field path that produced it
- **Ingestion is asynchronous** — Apify actor runs are triggered and polled; the frontend never waits synchronously for scraping to complete
- **Source failures are isolated** — failure of one source does not block ingestion from others

---

## 2. Source Registry

### Source 1: Google Scholar (via Apify)

| Property | Value |
|---|---|
| **Status** | MVP — Phase 1 |
| **Access Method** | Apify Actor (`apify/google-scholar-scraper` or equivalent) |
| **Trigger** | Admin-initiated per faculty |
| **Auth Required** | No (public data) |
| **Rate Limits** | Managed by Apify |
| **Apify Input** | `{ "scholar_id": "abc123" }` |

**Data Extracted**:
```json
{
  "name": "Dr. Meera Pillai",
  "affiliation": "National Institute of Technology",
  "research_interests": ["Machine Learning", "NLP"],
  "h_index": 22,
  "i10_index": 38,
  "total_citations": 1840,
  "publications": [
    {
      "title": "Attention-based Neural Machine Translation...",
      "year": 2022,
      "venue": "ACL 2022",
      "citation_count": 142,
      "url": "https://scholar.google.com/..."
    }
  ]
}
```

**Normalization Mapping**:
| Source Field | Unified Field |
|---|---|
| `name` | `identity.display_name` (candidate) |
| `affiliation` | `identity.institution` (candidate) |
| `h_index` | `metrics.h_index` |
| `total_citations` | `metrics.total_citations` |
| `publications[*]` | `publications[]` |

---

### Source 2: ResearchGate (via Apify)

| Property | Value |
|---|---|
| **Status** | Planned — Phase 2 |
| **Access Method** | Apify Actor (TBD — ResearchGate blocks aggressive scraping) |
| **Fallback** | Manual profile URL entry + partial scraping |

**Data Extracted** (anticipated):
- Name, institution, department
- Publication list with read counts
- Research interest tags
- Followers / following (as reach proxy)

**Known Limitations**:
- ResearchGate frequently changes DOM structure — Apify actor must be versioned
- Citation counts differ from Scholar (different methodology)
- Some profiles are private

---

### Source 3: Institutional Data

| Property | Value |
|---|---|
| **Status** | MVP — Phase 1 |
| **Access Method** | Admin CSV upload or REST API (institution-specific) |
| **Format** | CSV or JSON with defined schema |
| **Auth Required** | Institutional credentials (admin-side only) |

**Expected Schema** (CSV / JSON):
```
employee_id, canonical_name, email, department, designation,
joining_date, qualification, course_load_hours, admin_roles
```

This is the **source of truth** for:
- Canonical name (used in identity resolution)
- Employment status and designation
- Department mapping

---

### Future Sources (Planned)

| Source | Data Value | Phase |
|---|---|---|
| **ORCID Public API** | DOI-linked publications, grants | Phase 3 |
| **Scopus** | Citation metrics, journal rankings (SJR/SNIP) | Phase 4 (license required) |
| **Web of Science** | JCR Impact Factor, indexed publications | Phase 4 (license required) |
| **Shodhganga** | PhD thesis supervisions | Phase 3 |
| **Patent Office APIs** | Filed and granted patents | Phase 3 |
| **NPTEL** | Course delivery credits | Phase 3 |

---

## 3. Identity Resolution Logic

Matching a source record to the correct `faculty_entity` is critical and must be conservative.

### Matching Strategy (Deterministic, Confidence-Scored)

```
For each incoming source_record:

1. EXACT MATCH (confidence 1.0):
   - Match on known source ID (scholar_id, orcid_id, etc.)
   → Auto-link to faculty_entity

2. STRONG MATCH (confidence 0.85+):
   - Canonical name exact match (normalized, lowercased)
   - AND institution match (fuzzy, >80% similarity)
   → Auto-link with audit event

3. CANDIDATE MATCH (confidence 0.60–0.84):
   - Name fuzzy match (Levenshtein < 2, or phonetic match)
   - OR email domain match
   → Flag for human review

4. NO MATCH (confidence < 0.60):
   → Create unlinked source_record, alert admin
```

Human review is required for candidate matches. No auto-linking below 0.85 confidence unless a source ID is known.

---

## 4. Normalization Rules

Each source has a **normalization adapter** — a function that maps source-specific field names and formats to the unified profile schema.

```python
# Example: Google Scholar normalization adapter
def normalize_google_scholar(raw: dict) -> NormalizedProfile:
    return NormalizedProfile(
        display_name=raw.get("name"),
        institution=raw.get("affiliation"),
        h_index=raw.get("citedby", {}).get("h_index"),
        total_citations=raw.get("citedby", {}).get("all_citations"),
        publications=[
            normalize_publication(p, source="google_scholar")
            for p in raw.get("publications", [])
        ]
    )
```

---

## 5. Deduplication Logic

### Publication Deduplication

Priority order for matching publications across sources:

1. **DOI match** — definitive, auto-deduplicate
2. **Title similarity >95%** (normalized) — strong candidate, auto-deduplicate
3. **Title similarity 80–95% + same year** — candidate, flag for review
4. **Below 80%** — treat as separate publication

### Profile Field Conflicts

When two sources report different values for the same field:

1. Store both in `profile_conflicts`
2. Mark unified profile field as unresolved
3. Completeness score is not penalized, but confidence score is reduced
4. Admin resolves by selecting source or entering manual override

---

## 6. Apify Integration Architecture

```
Backend service receives trigger request
              │
              ▼
POST https://api.apify.com/v2/acts/{actor_id}/runs
  Body: { "scholar_id": "...", ... }
  Headers: { "Authorization": "Bearer APIFY_API_TOKEN" }
              │
              ▼
Backend stores job_id, sets source_record status = "pending"
              │
              ▼
Background worker polls Apify run status (every 5s, max 2min)
              │
              ▼
On completion: fetch dataset from Apify, store raw_data in source_records
              │
              ▼
Trigger normalization pipeline asynchronously
```

The Apify API token is stored as a backend environment variable and **never** exposed to the frontend.
