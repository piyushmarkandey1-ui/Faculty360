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
