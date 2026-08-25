CREATE TABLE IF NOT EXISTS assessment_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add framework_id to assessments
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS framework_id UUID REFERENCES assessment_frameworks(id);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 0;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS missing_evidence_count INTEGER DEFAULT 0;

-- Add status to kpi_scores to track INSUFFICIENT_EVIDENCE
ALTER TABLE kpi_scores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'VALID';
