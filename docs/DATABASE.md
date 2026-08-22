# AcadLens — Database Schema (Boundary Document)

> **Status**: Architecture boundary document. PostgreSQL / Supabase not yet implemented.
> This document defines the intended schema to guide frontend type definitions and API contract design.

---

## 1. Database Technology

| Concern | Technology |
|---|---|
| Primary database | PostgreSQL (via Supabase in MVP) |
| ORM | SQLAlchemy (async) |
| Migrations | Alembic |
| Hosting (MVP) | Supabase (managed Postgres + Auth + Storage) |

---

## 2. Entity Relationship Overview

```
users
  └── faculty_entities          (one user = one managed faculty entity)
        ├── source_records       (raw data snapshots per source per faculty)
        ├── unified_profiles     (resolved, normalized profile)
        │     ├── publications   (deduplicated publication records)
        │     └── profile_conflicts (detected data conflicts)
        ├── assessments          (immutable assessment snapshots)
        │     ├── kpi_scores     (individual rule outputs)
        │     └── ai_insights    (LLM narrative, linked to assessment)
        └── audit_events         (every significant state change)
```

---

## 3. Core Table Definitions

### `users`
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('admin', 'dept_head', 'viewer')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### `faculty_entities`
The central record for each faculty member being tracked.
```sql
CREATE TABLE faculty_entities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Canonical identity fields
    canonical_name  TEXT NOT NULL,
    canonical_email TEXT,
    department      TEXT,
    designation     TEXT,         -- e.g., "Assistant Professor"
    institution     TEXT NOT NULL,
    -- Source identifiers (populated as sources are connected)
    scholar_id      TEXT,         -- Google Scholar profile ID
    researchgate_slug TEXT,
    orcid_id        TEXT,
    -- Status
    onboarding_status TEXT NOT NULL DEFAULT 'pending'
                      CHECK (onboarding_status IN ('pending', 'active', 'archived')),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### `source_records`
Raw, unmodified snapshots of data fetched from each external source.
```sql
CREATE TABLE source_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id      UUID NOT NULL REFERENCES faculty_entities(id) ON DELETE CASCADE,
    source_type     TEXT NOT NULL CHECK (source_type IN ('google_scholar', 'researchgate', 'institutional', 'orcid')),
    raw_data        JSONB NOT NULL,  -- Unmodified payload from Apify or source API
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    apify_run_id    TEXT,            -- Apify run ID for traceability
    status          TEXT NOT NULL DEFAULT 'raw'
                    CHECK (status IN ('raw', 'normalized', 'error'))
);
```

---

### `unified_profiles`
The resolved, normalized, de-conflicted view of a faculty member.
```sql
CREATE TABLE unified_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id          UUID UNIQUE NOT NULL REFERENCES faculty_entities(id),
    -- Resolved identity
    display_name        TEXT,
    bio                 TEXT,
    research_interests  TEXT[],
    -- Computed quality indicators
    completeness_score  NUMERIC(5,2),  -- 0.00–100.00
    source_coverage     JSONB,         -- {"google_scholar": true, "researchgate": false, ...}
    conflict_count      INTEGER DEFAULT 0,
    -- Timestamps
    last_synced_at      TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ DEFAULT now()
);
```

---

### `publications`
Deduplicated publication records linked to a unified profile.
```sql
CREATE TABLE publications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id          UUID NOT NULL REFERENCES faculty_entities(id),
    -- Core fields
    title               TEXT NOT NULL,
    year                INTEGER,
    venue               TEXT,         -- Journal or conference name
    doi                 TEXT,         -- Used as deduplication key when available
    citation_count      INTEGER DEFAULT 0,
    -- Sourcing
    source_type         TEXT NOT NULL,
    source_record_id    UUID REFERENCES source_records(id),
    is_verified         BOOLEAN DEFAULT FALSE,
    dedup_status        TEXT DEFAULT 'unique'
                        CHECK (dedup_status IN ('unique', 'duplicate', 'candidate')),
    created_at          TIMESTAMPTZ DEFAULT now()
);
```

---

### `profile_conflicts`
Tracks data fields where multiple sources disagree.
```sql
CREATE TABLE profile_conflicts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id      UUID NOT NULL REFERENCES faculty_entities(id),
    field_name      TEXT NOT NULL,       -- e.g., "citation_count", "h_index", "affiliation"
    source_a        TEXT NOT NULL,
    value_a         TEXT NOT NULL,
    source_b        TEXT NOT NULL,
    value_b         TEXT NOT NULL,
    resolution      TEXT CHECK (resolution IN ('source_a', 'source_b', 'manual', 'unresolved'))
                    DEFAULT 'unresolved',
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    detected_at     TIMESTAMPTZ DEFAULT now()
);
```

---

### `assessments`
Immutable snapshots of an assessment run. Once created, never modified.
```sql
CREATE TABLE assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id          UUID NOT NULL REFERENCES faculty_entities(id),
    -- Snapshot metadata
    assessed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    assessed_by         UUID REFERENCES users(id),
    profile_snapshot    JSONB NOT NULL,  -- Full unified_profile at assessment time
    -- Computed outputs (RULE ENGINE ONLY — never AI)
    total_score         NUMERIC(8,2),
    completeness_score  NUMERIC(5,2),
    confidence_score    NUMERIC(5,2),   -- Derived from completeness + conflict resolution
    status              TEXT DEFAULT 'draft'
                        CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);
```

---

### `kpi_scores`
Individual KPI rule outputs for each assessment.
```sql
CREATE TABLE kpi_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id),
    rule_id         TEXT NOT NULL,        -- e.g., "publications.scopus_indexed"
    rule_name       TEXT NOT NULL,
    category        TEXT NOT NULL,        -- e.g., "Research Output"
    raw_value       NUMERIC,              -- Input value from profile
    computed_score  NUMERIC(8,2) NOT NULL,
    max_score       NUMERIC(8,2),
    evidence        JSONB,                -- Source record IDs and field paths used
    rule_version    TEXT NOT NULL         -- Version of rule at time of assessment
);
```

---

### `ai_insights`
LLM-generated narrative. Linked to an assessment but NEVER used in score computation.
```sql
CREATE TABLE ai_insights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id   UUID NOT NULL REFERENCES assessments(id),
    model           TEXT NOT NULL,        -- e.g., "gemini-1.5-pro"
    prompt_version  TEXT NOT NULL,
    insight_text    TEXT NOT NULL,
    generated_at    TIMESTAMPTZ DEFAULT now(),
    -- Explicit guardrail fields
    contains_scores BOOLEAN DEFAULT FALSE CHECK (contains_scores = FALSE),
    is_advisory     BOOLEAN DEFAULT TRUE  CHECK (is_advisory = TRUE)
);
```
> Note: `contains_scores = FALSE` and `is_advisory = TRUE` are enforced as CHECK constraints — the schema itself enforces the RULES CALCULATE / AI INTERPRETS boundary.

---

### `audit_events`
Append-only log of all significant state changes.
```sql
CREATE TABLE audit_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,     -- 'faculty_entity', 'assessment', 'conflict', etc.
    entity_id   UUID NOT NULL,
    action      TEXT NOT NULL,     -- 'created', 'updated', 'conflict_resolved', 'assessment_approved', etc.
    actor_id    UUID REFERENCES users(id),
    actor_role  TEXT,
    before      JSONB,
    after       JSONB,
    occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent updates and deletes — append-only enforcement
CREATE RULE no_update_audit AS ON UPDATE TO audit_events DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_events DO INSTEAD NOTHING;
```

---

## 4. Key Design Decisions

| Decision | Rationale |
|---|---|
| `source_records.raw_data JSONB` | Preserve original payload exactly — enables re-normalization if rules change |
| `assessments.profile_snapshot JSONB` | Immutable point-in-time record — assessments remain valid even if profile later changes |
| `ai_insights` CHECK constraints | Schema-level enforcement of AI advisory boundary |
| Append-only `audit_events` | Cannot be modified even by admins — full provenance guarantee |
| `publications.doi` as dedup key | DOI is the most reliable cross-source deduplication anchor |
