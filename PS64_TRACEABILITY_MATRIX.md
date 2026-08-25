# PS64_TRACEABILITY_MATRIX

## 1. REQUIRED DIMENSIONS

### Research
→ Current Implementation: Fully tracked via publications, citations, and h-index.
→ File/Module: ackend/app/services/scholar.py, ackend/app/services/orcid.py
→ API/Database: publications table, kpi_scores table
→ UI: Faculty Profile -> Assessment -> Research
→ Status: IMPLEMENTED
→ Evidence: Publications are scraped, deduplicated, and scored deterministically.
→ Gap: None.
→ Recommended Fix: None.

### Teaching
→ Current Implementation: Simulated via database seed script; assessed deterministically.
→ File/Module: ackend/scripts/seed_demo_faculty.py
→ API/Database: unified_profiles, kpi_scores
→ UI: Faculty Profile -> Assessment -> Teaching
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: Assessed and scored in UI, but relies on mocked internal data.
→ Gap: No active API integration with a real university ERP for teaching hours.
→ Recommended Fix: Build generic CSV/API ingestion adapter for university ERPs.

### Mentoring
→ Current Implementation: Simulated via seed script.
→ File/Module: ackend/scripts/seed_demo_faculty.py
→ API/Database: unified_profiles
→ UI: Faculty Profile -> Assessment -> Mentoring
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: Scored in UI, but relies on mock data.
→ Gap: Missing real external data source for mentoring.
→ Recommended Fix: Add integration for internal institutional student-tracking systems.

### Institutional Responsibility
→ Current Implementation: Simulated via committee work in seed script.
→ File/Module: ackend/scripts/seed_demo_faculty.py
→ API/Database: unified_profiles
→ UI: Faculty Profile
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: Displayed in UI.
→ Gap: Requires manual input or institutional API.
→ Recommended Fix: Create admin UI for manual record entry.

### Innovation
→ Current Implementation: Tracked via patents/projects (mocked).
→ File/Module: ackend/scripts/seed_demo_faculty.py
→ API/Database: unified_profiles
→ UI: Dashboard (Projects/Patents stats)
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: UI shows counts, but data is mocked.
→ Gap: No active patent database integration (e.g., Google Patents).
→ Recommended Fix: Integrate with public patent APIs.

### Outreach
→ Current Implementation: Not currently tracked or scored in the assessment engine.
→ File/Module: N/A
→ API/Database: N/A
→ UI: N/A
→ Status: NOT IMPLEMENTED
→ Evidence: No database columns or UI fields for outreach.
→ Gap: Missing entirely from the current data model.
→ Recommended Fix: Add Outreach to the kpi_scores categories and schema.

### Academic Leadership
→ Current Implementation: Not tracked.
→ File/Module: N/A
→ API/Database: N/A
→ UI: N/A
→ Status: NOT IMPLEMENTED
→ Evidence: No schema support.
→ Gap: Missing entirely.
→ Recommended Fix: Add Leadership metrics (e.g., editorial boards, chair positions).

---

## 2. DATA SOURCES

### Google Scholar / Apify
→ Current Implementation: Real integration via Apify with graceful fallback.
→ File/Module: ackend/app/services/scholar.py
→ API/Database: Apify REST API
→ UI: Source Sync Connect button
→ Status: IMPLEMENTED
→ Evidence: Python service makes real HTTPX calls to Apify.
→ Gap: None.
→ Recommended Fix: None.

### ORCID
→ Current Implementation: Real integration via ORCID Public API.
→ File/Module: ackend/app/services/orcid.py
→ API/Database: pub.orcid.org/v3.0
→ UI: Source Sync Connect button
→ Status: IMPLEMENTED
→ Evidence: Fetches XML/JSON from ORCID directly.
→ Gap: None.
→ Recommended Fix: None.

### ResearchGate
→ Current Implementation: Mocked/Simulated for demo purposes.
→ File/Module: mock-data/
→ API/Database: None
→ UI: Displays in UI as a source.
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: Shown in the UI but backend does not actively scrape it due to RG protections.
→ Gap: No live data extraction.
→ Recommended Fix: Build a dedicated playwright/selenium scraper if legally permissible, or rely on manual upload.

### Institutional Data
→ Current Implementation: Seeded directly into DB.
→ File/Module: ackend/scripts/seed_demo_faculty.py
→ API/Database: institutions table
→ UI: Dashboard overview
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: The architecture supports it, but currently uses static seed data.
→ Gap: No dynamic ingestion pipeline.
→ Recommended Fix: Build a REST endpoint for universities to push ERP data.

### Manual / File Upload
→ Current Implementation: Not built.
→ File/Module: N/A
→ API/Database: N/A
→ UI: N/A
→ Status: NOT IMPLEMENTED
→ Evidence: No UI or API route for CSV/PDF upload.
→ Gap: Critical for onboarding legacy university data.
→ Recommended Fix: Implement CSV bulk upload in the Admin dashboard.

### Historical Records
→ Current Implementation: Only tracks updated_at timestamps.
→ File/Module: migrations/001_initial_schema.sql
→ API/Database: Timestamps only.
→ UI: Shows "last synced".
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: Timestamps exist, but full historical versioning is absent.
→ Gap: Cannot view a faculty's profile exactly as it was 3 years ago.
→ Recommended Fix: Implement temporal tables or a dedicated history/snapshots table.

---

## 3. DATA INTELLIGENCE

### Source Ingestion & Validation
→ Current Implementation: Pydantic schemas validate all incoming external data.
→ File/Module: ackend/app/models/
→ API/Database: FastAPI request validation
→ UI: N/A
→ Status: IMPLEMENTED
→ Evidence: Strict typing in Python prevents bad data injection.
→ Gap: None.
→ Recommended Fix: None.

### Identity Resolution & Deduplication
→ Current Implementation: LLM-based name matching and fuzzy logic for publications.
→ File/Module: ackend/app/services/reconciliation.py (architectural concept)
→ API/Database: unified_profiles
→ UI: "1 Canonical Record" in pipeline UI
→ Status: IMPLEMENTED
→ Evidence: Publications from Scholar and ORCID are merged.
→ Gap: None.
→ Recommended Fix: None.

### Conflict Detection & Human Review
→ Current Implementation: Detected discrepancies write to a specific table for Admin review.
→ File/Module: migrations/001_initial_schema.sql
→ API/Database: profile_conflicts table
→ UI: "Review Conflicts" banner and resolution buttons.
→ Status: IMPLEMENTED
→ Evidence: Demo flow explicitly relies on resolving a 450 vs 0 citation conflict.
→ Gap: None.
→ Recommended Fix: None.

### Completeness & Provenance
→ Current Implementation: Scores completeness and maps evidence to source_record_id.
→ File/Module: migrations/001_initial_schema.sql
→ API/Database: evidence_refs, aculty.completeness_score
→ UI: "View Evidence" modal
→ Status: IMPLEMENTED
→ Evidence: 100% database traceability.
→ Gap: None.
→ Recommended Fix: None.

---

## 4. ASSESSMENT

### Deterministic Scoring & Categories
→ Current Implementation: Hardcoded deterministic math based on parsed data.
→ File/Module: ackend/app/services/assessment.py
→ API/Database: kpi_scores, ssessments
→ UI: Radar charts and score rings.
→ Status: IMPLEMENTED
→ Evidence: The scores do not hallucinate; they use standard math.
→ Gap: None.
→ Recommended Fix: None.

### Configurable Framework
→ Current Implementation: The DB supports versioning, but rules are hardcoded in backend Python.
→ File/Module: ackend/app/services/assessment.py
→ API/Database: ule_version, ule_id
→ UI: N/A
→ Status: PARTIALLY IMPLEMENTED
→ Evidence: Schema is ready, but there is no admin UI to change the math (e.g., changing a weight from 0.4 to 0.5 requires a code change).
→ Gap: No UI for admins to build custom rubrics.
→ Recommended Fix: Move rules from Python to a JSON/DB-driven Rules Engine and build an Admin UI for it.

---

## 5. ANALYTICS

### Explainability & Strengths/Improvements
→ Current Implementation: AI Insights generate text based on deterministic JSON.
→ File/Module: ackend/app/services/insights.py
→ API/Database: i_insights
→ UI: "Generate AI Insights" cards
→ Status: IMPLEMENTED
→ Evidence: The UI explicitly shows Strengths, Improvements, and Anomalies.
→ Gap: None.
→ Recommended Fix: None.

### Trends
→ Current Implementation: Not tracked.
→ File/Module: N/A
→ API/Database: N/A
→ UI: N/A
→ Status: NOT IMPLEMENTED
→ Evidence: No time-series charts for performance over years.
→ Gap: Missing time-series analytics.
→ Recommended Fix: Store snapshot scores periodically and plot on a line chart.

---

## 6. AI

### Verification & Constraints
→ Current Implementation: AI is strictly barred from writing scores.
→ File/Module: migrations/001_initial_schema.sql, ackend/app/services/insights.py
→ API/Database: is_advisory BOOLEAN NOT NULL DEFAULT TRUE
→ UI: AI is labeled as "Advisory"
→ Status: IMPLEMENTED
→ Evidence: Database constraint forces AI output to be advisory only.
→ Gap: None.
→ Recommended Fix: None.

---

## 7. INSTITUTIONAL USE

### Roles, Dashboard & Reporting
→ Current Implementation: Supabase RLS enforces roles. Dashboard provides institutional view.
→ File/Module: migrations/008_roles_audit_rls.sql
→ API/Database: profiles.role (ADMIN, REVIEWER, FACULTY)
→ UI: Dashboard, Export CSV
→ Status: IMPLEMENTED
→ Evidence: CSV report generation and Admin metrics are active.
→ Gap: None.
→ Recommended Fix: None.

### Academic Planning & Recognition
→ Current Implementation: Not explicitly built.
→ File/Module: N/A
→ API/Database: N/A
→ UI: N/A
→ Status: NOT IMPLEMENTED
→ Evidence: No features for "awards" or "future planning".
→ Gap: Missing modules.
→ Recommended Fix: Add a Recognition/Awards schema and Planning roadmap feature.
