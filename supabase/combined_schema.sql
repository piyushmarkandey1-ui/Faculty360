-- ==========================================

-- MIGRATION: 001_initial_schema.sql

-- ==========================================

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


-- ==========================================

-- MIGRATION: 002_rls_policies.sql

-- ==========================================

-- ============================================================
-- AcadLens — Migration 002: Row Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- Enable RLS on all application tables
-- ------------------------------------------------------------
ALTER TABLE institutions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty           ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_scores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_refs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights       ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Helper functions (SECURITY DEFINER = run as DB owner,
-- not as calling user — prevents privilege escalation)
-- ------------------------------------------------------------

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns the institution_id of the currently authenticated user
CREATE OR REPLACE FUNCTION current_user_institution()
RETURNS UUID AS $$
  SELECT institution_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------
-- PROFILES
-- Each user can read and update their own profile.
-- ADMINs can read all profiles in their institution.
-- ------------------------------------------------------------
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_admin_select_all"
  ON profiles FOR SELECT
  USING (current_user_role() = 'ADMIN');

-- ------------------------------------------------------------
-- INSTITUTIONS
-- All authenticated users can read institutions.
-- Only ADMINs can create/update/delete.
-- ------------------------------------------------------------
CREATE POLICY "institutions_select_authenticated"
  ON institutions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "institutions_admin_all"
  ON institutions FOR ALL
  USING (current_user_role() = 'ADMIN');

-- ------------------------------------------------------------
-- FACULTY
-- Scoped by institution.
-- ADMINs: full CRUD within their institution.
-- REVIEWERs: read-only within their institution.
-- ------------------------------------------------------------
CREATE POLICY "faculty_admin_all"
  ON faculty FOR ALL
  USING (
    current_user_role() = 'ADMIN'
    AND institution_id = current_user_institution()
  );

CREATE POLICY "faculty_reviewer_select"
  ON faculty FOR SELECT
  USING (
    current_user_role() IN ('ADMIN', 'REVIEWER')
    AND institution_id = current_user_institution()
  );

-- ------------------------------------------------------------
-- ACADEMIC IDENTITIES
-- ------------------------------------------------------------
CREATE POLICY "academic_identities_admin_all"
  ON academic_identities FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "academic_identities_reviewer_select"
  ON academic_identities FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));

-- ------------------------------------------------------------
-- UNIFIED PROFILES
-- ------------------------------------------------------------
CREATE POLICY "unified_profiles_admin_all"
  ON unified_profiles FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "unified_profiles_reviewer_select"
  ON unified_profiles FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));

-- ------------------------------------------------------------
-- PUBLICATIONS
-- ------------------------------------------------------------
CREATE POLICY "publications_admin_all"
  ON publications FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "publications_reviewer_select"
  ON publications FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));

-- ------------------------------------------------------------
-- ASSESSMENTS
-- ------------------------------------------------------------
CREATE POLICY "assessments_admin_all"
  ON assessments FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "assessments_reviewer_select"
  ON assessments FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));

-- ------------------------------------------------------------
-- KPI SCORES
-- ------------------------------------------------------------
CREATE POLICY "kpi_scores_admin_all"
  ON kpi_scores FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "kpi_scores_reviewer_select"
  ON kpi_scores FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));

-- ------------------------------------------------------------
-- EVIDENCE REFS
-- ------------------------------------------------------------
CREATE POLICY "evidence_refs_admin_all"
  ON evidence_refs FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "evidence_refs_reviewer_select"
  ON evidence_refs FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));

-- ------------------------------------------------------------
-- PROFILE CONFLICTS
-- ------------------------------------------------------------
CREATE POLICY "profile_conflicts_admin_all"
  ON profile_conflicts FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "profile_conflicts_reviewer_select"
  ON profile_conflicts FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));

-- ------------------------------------------------------------
-- AI INSIGHTS
-- ------------------------------------------------------------
CREATE POLICY "ai_insights_admin_all"
  ON ai_insights FOR ALL
  USING (current_user_role() = 'ADMIN');

CREATE POLICY "ai_insights_reviewer_select"
  ON ai_insights FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'REVIEWER'));


-- ==========================================

-- MIGRATION: 003_institutional_records.sql

-- ==========================================

-- Add employee_id to faculty table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;

-- Create table for unified institutional records (Teaching, Projects, Awards, etc.)
CREATE TABLE IF NOT EXISTS institutional_records (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id     UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  category       TEXT NOT NULL
                 CHECK (category IN ('Teaching', 'Mentoring', 'Institutional Service', 'Awards', 'Projects', 'Innovation', 'Outreach')),
  title          TEXT NOT NULL,
  description    TEXT,
  year           INTEGER,
  source_type    TEXT NOT NULL DEFAULT 'institutional',
  is_verified    BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for unmatched records
CREATE TABLE IF NOT EXISTS unmatched_institutional_records (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id    TEXT,
  email          TEXT,
  category       TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  year           INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================

-- MIGRATION: 004_normalization.sql

-- ==========================================

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


-- ==========================================

-- MIGRATION: 005_assessment_framework.sql

-- ==========================================

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


-- ==========================================

-- MIGRATION: 006_assessment_analytics.sql

-- ==========================================

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS analytics JSONB;


-- ==========================================

-- MIGRATION: 007_ai_insights.sql

-- ==========================================

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS ai_insights JSONB;


-- ==========================================

-- MIGRATION: 008_roles_audit_rls.sql

-- ==========================================

-- Link profiles to faculty for the FACULTY role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculty(id);

-- ------------------------------------------------------------
-- AUDIT TRAIL
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------
-- Enable RLS on core tables
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutional_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can read their own, Admin can read all
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 2. Faculty: 
-- Admin/Reviewer: read all
-- Faculty: read own
CREATE POLICY "Admin/Reviewer can view all faculty" ON faculty
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'REVIEWER')
        )
    );

CREATE POLICY "Faculty can view own faculty record" ON faculty
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'FACULTY'
            AND profiles.faculty_id = faculty.id
        )
    );

-- 3. Assessments:
CREATE POLICY "Admin/Reviewer can view all assessments" ON assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'REVIEWER')
        )
    );

CREATE POLICY "Faculty can view own assessments" ON assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'FACULTY'
            AND profiles.faculty_id = assessments.faculty_id
        )
    );

-- 4. Audit Logs: Admin only
CREATE POLICY "Admin can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

