-- ============================================================
-- AcadLens — Migration 001: Initial Schema
-- Run this in: Supabase Dashboard ? SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- INSTITUTIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS institutions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  city        TEXT,
  state       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PROFILES (extends auth.users — one row per registered user)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  role           TEXT NOT NULL DEFAULT 'REVIEWER'
                   CHECK (role IN ('ADMIN', 'REVIEWER', 'FACULTY')),
  institution_id UUID REFERENCES institutions(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- FACULTY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id     UUID NOT NULL REFERENCES institutions(id),
  canonical_name     TEXT NOT NULL,
  canonical_email    TEXT,
  department         TEXT NOT NULL,
  designation        TEXT NOT NULL,
  onboarding_status  TEXT NOT NULL DEFAULT 'pending'
                       CHECK (onboarding_status IN ('pending', 'active', 'archived')),
  completeness_score NUMERIC(5,2) DEFAULT 0,
  conflict_count     INTEGER DEFAULT 0,
  last_synced_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- ACADEMIC IDENTITIES (Scholar ID, ORCID, RG slug, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_identities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id   UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  source_type  TEXT NOT NULL
                 CHECK (source_type IN ('google_scholar','researchgate','orcid','institutional')),
  external_id  TEXT NOT NULL,
  profile_url  TEXT,
  is_verified  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(faculty_id, source_type)
);

-- ------------------------------------------------------------
-- UNIFIED PROFILES (resolved / merged profile per faculty)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS unified_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id          UUID NOT NULL UNIQUE REFERENCES faculty(id) ON DELETE CASCADE,
  display_name        TEXT NOT NULL,
  bio                 TEXT,
  research_interests  TEXT[] DEFAULT '{}',
  source_coverage     JSONB DEFAULT '{}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PUBLICATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS publications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id     UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  year           INTEGER,
  venue          TEXT,
  doi            TEXT,
  citation_count INTEGER DEFAULT 0,
  source_type    TEXT NOT NULL,
  is_verified    BOOLEAN DEFAULT FALSE,
  dedup_status   TEXT DEFAULT 'unique'
                   CHECK (dedup_status IN ('unique','duplicate','candidate')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- ASSESSMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id         UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  assessed_by        UUID REFERENCES auth.users(id),
  total_score        NUMERIC(5,2) DEFAULT 0,
  completeness_score NUMERIC(5,2) DEFAULT 0,
  confidence_score   NUMERIC(5,2) DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','submitted','approved','rejected')),
  assessed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- KPI SCORES (per assessment, per rule)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_scores (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id  UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  rule_id        TEXT NOT NULL,
  rule_name      TEXT NOT NULL,
  category       TEXT NOT NULL,
  raw_value      NUMERIC,
  computed_score NUMERIC(5,2) DEFAULT 0,
  max_score      NUMERIC(5,2) NOT NULL,
  rule_version   TEXT DEFAULT '1.0.0',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- EVIDENCE REFERENCES (links KPI scores to source records)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_refs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kpi_score_id     UUID NOT NULL REFERENCES kpi_scores(id) ON DELETE CASCADE,
  source_record_id TEXT NOT NULL,
  source_type      TEXT NOT NULL,
  field_path       TEXT NOT NULL,
  value            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PROFILE CONFLICTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_conflicts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id  UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  field_name  TEXT NOT NULL,
  source_a    TEXT NOT NULL,
  value_a     TEXT NOT NULL,
  source_b    TEXT NOT NULL,
  value_b     TEXT NOT NULL,
  resolution  TEXT DEFAULT 'unresolved'
                CHECK (resolution IN ('source_a','source_b','manual','unresolved')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- AI INSIGHTS (advisory only — never used to compute scores)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_insights (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
  model         TEXT NOT NULL,
  insight_text  TEXT NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_advisory   BOOLEAN NOT NULL DEFAULT TRUE   -- MUST always be TRUE
);

-- ------------------------------------------------------------
-- TRIGGERS: auto-update updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER institutions_updated_at   BEFORE UPDATE ON institutions    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER profiles_updated_at       BEFORE UPDATE ON profiles         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER faculty_updated_at        BEFORE UPDATE ON faculty          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER unified_profiles_updated_at BEFORE UPDATE ON unified_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- TRIGGER: auto-create profile row when user signs up
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'REVIEWER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ------------------------------------------------------------
-- SEED: Default institution (for development)
-- ------------------------------------------------------------
INSERT INTO institutions (name, code, city, state)
VALUES ('NIT Warangal', 'NITW', 'Warangal', 'Telangana')
ON CONFLICT (code) DO NOTHING;
