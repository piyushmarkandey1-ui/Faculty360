# PS64_GAP_LIST

This document outlines the genuine gaps in the current AcadLens implementation compared to the PS64 problem statement requirements. 
Gaps are prioritized based on their impact on a production deployment.

## CRITICAL PRIORITY

1. **Manual / File Upload Ingestion**
   - **Gap:** No ability for universities to upload CSVs/Excel files of legacy faculty data.
   - **Impact:** Blocks onboarding of universities that lack modern APIs.
   - **Fix:** Build a robust CSV mapper and upload endpoint in the Admin dashboard.

2. **Configurable Assessment UI (Rules Engine)**
   - **Gap:** The database supports ule_versions, but the actual scoring math is currently hardcoded in Python (ackend/app/services/assessment.py). 
   - **Impact:** Institutions cannot customize KPI weights without developer intervention.
   - **Fix:** Abstract the logic into a database-driven JSON rules engine and create a drag-and-drop UI for Admins to set weights.

## HIGH PRIORITY

3. **Live Institutional ERP Integration**
   - **Gap:** Institutional data (teaching hours, mentoring) is currently seeded statically. 
   - **Impact:** Requires manual database seeding for new institutions.
   - **Fix:** Expose a standardized secure REST API endpoint for university IT systems to push data via cron jobs.

4. **ResearchGate Live Extraction**
   - **Gap:** ResearchGate is strictly mocked due to anti-scraping protections.
   - **Impact:** Missing a major academic data source in live environments.
   - **Fix:** Implement a dedicated browser automation pipeline (Selenium/Playwright) or rely strictly on manual user uploads for RG data.

## MEDIUM PRIORITY

5. **Historical Records & Trends (Time-Series Analytics)**
   - **Gap:** The system stores the *current* state of a faculty member, but not historical snapshots (e.g., what was their score in 2022 vs 2024).
   - **Impact:** Analytics cannot show performance trends over time.
   - **Fix:** Implement a monthly snapshot job that writes to a historical_assessments table and visualize with a Line Chart in the UI.

6. **Outreach & Academic Leadership Dimensions**
   - **Gap:** These specific PS64 dimensions are entirely missing from the database schema and UI.
   - **Impact:** Fails to capture non-research/non-teaching contributions fully.
   - **Fix:** Expand the kpi_scores categories and the unified_profiles schema to include Leadership (e.g., editorial boards) and Outreach.

## LOW PRIORITY

7. **Academic Planning & Recognition Modules**
   - **Gap:** No dedicated UI for predicting future hiring needs or officially recognizing top faculty.
   - **Impact:** Limits the platform's use as a proactive HR tool.
   - **Fix:** Add a "Future Planning" predictive module and a "Awards" tracker to the dashboard.
