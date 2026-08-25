# AcadLens — SIH Presentation Notes

This document contains only verified information based on the current active implementation of the AcadLens platform. Use this as your source of truth when answering technical questions from the judges.

## 1. Problem Being Solved
Accreditation bodies (NAAC/NBA) and universities spend months manually collecting, verifying, and aggregating fragmented faculty data (publications, teaching hours, mentoring) from disparate sources. The process is error-prone, subjective, and lacks transparent evidence.

## 2. AcadLens Solution
An AI-powered B2B platform that automatically ingests faculty data from internal institutional databases and external academic networks. It merges records, detects conflicts, and autonomously generates transparent, evidence-backed assessment scores.

## 3. End-to-End Workflow
1. **Ingest:** Pull data from APIs (Scholar, ORCID) and Institutional databases.
2. **Reconcile:** Normalize names, deduplicate papers, and flag data conflicts.
3. **Assess:** Calculate scores based on deterministic KPIs.
4. **Explain:** Generate AI-driven insights explaining the "why" behind every score, linking directly to the source evidence.

## 4. Technology Stack
- **Frontend:** Next.js 14, React, Tailwind CSS, Framer Motion, Recharts, TypeScript.
- **Backend:** Python, FastAPI, Pydantic, HTTPX.
- **Database:** PostgreSQL (hosted on Supabase) with pgvector.
- **AI/LLM:** Google Gemini 1.5 Flash (via python-google-genai).
- **Scraping:** Apify API (Google Scholar Actor).

## 5. System Architecture
- **Client-Server Model:** The Next.js frontend calls the FastAPI backend. 
- **Database:** Supabase acts as the central source of truth.
- **Authentication:** Supabase Auth (JWT) is verified by FastAPI middleware.
- **Stateless Aggregation:** The backend fetches external data in real-time or via background jobs and updates Supabase.

## 6. Data Sources
- **Internal:** Institutional Databases (simulated via seed data).
- **External:** Google Scholar, ORCID, ResearchGate.

## 7. Google Scholar + Apify Flow
- Implemented in ackend/app/services/scholar.py.
- Uses the Apify API (pify/google-scholar) to scrape public profiles.
- **Extraction:** Retrieves citation counts, h-index, i10-index, and publication lists.
- **Fallback:** If the API key is missing or rate-limited, it gracefully degrades to a deterministic mock dataset to ensure demo stability.

## 8. ORCID Integration
- Implemented in ackend/app/services/orcid.py.
- Connects to the public ORCID API endpoint (pub.orcid.org/v3.0).
- **Extraction:** Retrieves employment history, education, and works.
- **Fallback:** Also degrades to a controlled mock dataset if the API is unreachable.

## 9. ResearchGate Integration Status
- ResearchGate heavily restricts scraping and lacks a public API. 
- In the current implementation, this is treated as a **mocked/simulated source** to demonstrate how the reconciliation engine handles a third data stream.

## 10. Institutional Data Ingestion
- Represented by seed data (ackend/scripts/seed_demo_faculty.py).
- Models internal university ERP systems (e.g., teaching hours, committee work, internal grants) that cannot be found on public internet profiles.

## 11. Normalization & Deduplication
- **Identity Resolution:** The system normalizes faculty names (e.g., "R. K. Sharma" vs "Rajesh Kumar Sharma") using the Gemini 1.5 LLM.
- **Record Deduplication:** Papers are deduplicated by fuzzy matching titles and years, producing a single unified_profiles output.

## 12. Conflict Detection
- If two sources provide conflicting data for the exact same entity (e.g., Google Scholar says 450 citations, ORCID says 0 citations for the same paper), a profile_conflicts record is generated.
- These are surfaced in the UI for Human-in-the-loop (HITL) resolution.

## 13. Evidence / Provenance
- The database schema includes an evidence_refs table.
- Every computed KPI score links back to a specific source_record_id (e.g., the exact JSON payload from ORCID) ensuring 100% auditability for accreditation bodies.

## 14. Assessment Engine
- Implemented in ackend/app/services/assessment.py.
- A deterministic rules engine calculates scores across categories like Research Output, Teaching, and Mentoring. It relies strictly on mathematical logic, not LLM hallucinations.

## 15. Explainability
- The UI exposes a "View Evidence" interface.
- Clicking on a score (e.g., 81.5 for Research) shows exactly how many canonical publications contributed to it, removing the "black box" nature of typical AI tools.

## 16. AI Insights
- Implemented using Google Gemini 1.5 Flash.
- After the deterministic score is calculated, the LLM reads the final JSON assessment and writes a human-readable advisory (e.g., "Strength: Citations are 20% above benchmark").
- Crucially, the AI is **advisory only**; it does not calculate the score itself.

## 17. Roles & Security
- **Database Level:** Supabase Row Level Security (RLS) is active.
- **Roles:** ADMIN (Institution Dean), REVIEWER (NAAC), FACULTY (Individual).
- **Current Demo:** The UI is scoped to the ADMIN view to showcase the aggregation and conflict resolution features.

## 18. Reports
- The platform supports generating CSV matrix reports summarizing all assessed faculty for easy export to accreditation bodies.

## 19. Demo Mode / Fallback Architecture
- **Offline Resilience:** All external API calls (Scholar, ORCID, Gemini) are wrapped in 	ry/except blocks.
- If the internet drops or rate limits hit during the SIH pitch, the backend silently falls back to injecting the specific Machine Learning for Geospatial Data Analysis publication to guarantee the conflict detection demo works flawlessly.

## 20. Current Limitations
- ResearchGate is fully mocked due to scraping protections.
- True SSO integration with university identity providers (SAML/OAuth) is not implemented (currently uses email/password).
- Real-time background sync queues (like Celery/Redis) are simulated via immediate synchronous API calls for hackathon simplicity.
