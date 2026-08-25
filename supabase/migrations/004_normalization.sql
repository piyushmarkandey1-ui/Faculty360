-- 1. Modify publications for unification
ALTER TABLE publications ADD COLUMN IF NOT EXISTS normalized_title TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,2) DEFAULT 100.0;

-- 2. Publication Sources (Provenance / Evidence)
CREATE TABLE IF NOT EXISTS publication_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_url TEXT,
    original_title TEXT,
    original_year INTEGER,
    original_doi TEXT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(publication_id, source_type)
);

-- 3. Update profile_conflicts for Phase 2E rules
ALTER TABLE profile_conflicts ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'low';
ALTER TABLE profile_conflicts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'IGNORED'));

-- Data Quality Metrics cache on faculty table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS verified_evidence_count INTEGER DEFAULT 0;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS duplicate_records_count INTEGER DEFAULT 0;
