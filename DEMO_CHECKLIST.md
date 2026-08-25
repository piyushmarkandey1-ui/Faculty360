# AcadLens SIH Demo Checklist

## Prerequisites
1. **Database & Auth:** Supabase instance running with tables created (Migration 001-008).
2. **Backend:** FastAPI running locally (`uvicorn app.main:app --reload`) or on production URL with `.env` configured.
3. **Frontend:** Next.js application running (`npm run dev`) or deployed on Vercel.

## Environment Variables (.env)
* Ensure both frontend (`.env.local`) and backend (`.env`) have valid `SUPABASE_URL` and `SUPABASE_ANON_KEY`/`SERVICE_ROLE_KEY`.
* Ensure `GEMINI_API_KEY` is configured in the backend for AI Insights.
* (No real API keys should ever be committed to the repository).

## Demo Accounts
* **Admin/Reviewer Account:** Use any account signed up during testing, manually updated in `profiles.role` to `ADMIN` or `REVIEWER` via Supabase SQL editor if needed. (Default signup is `REVIEWER`).
* **Faculty Account:** Use an account with `profiles.role = 'FACULTY'` and mapped `faculty_id` to demonstrate the isolated Faculty view.

## Demo Workflow
1. **Login:** Log in as an Admin/Reviewer.
2. **Dashboard:** Show the aggregated institutional metrics (Total Faculty, Assessment Score, Conflict resolution tracking).
3. **Faculty Directory:** Navigate to the Faculty page. Show the list of indexed profiles.
4. **Faculty Profile (Identity/Sync):** Click on a faculty member. Demonstrate connecting Google Scholar. Click **Sync** (this triggers the backend Apify scraper + deduplication logic).
5. **Data Quality & Evidence:** Navigate to the "Assessments -> Evidence" tab. Show the normalized publications list and how the evidence maps to KPIs.
6. **Calculate Assessment:** Click "Run Cycle Assessment" or trigger the calculation. Explain that this uses deterministic formulas stored in JSON against real DB fields.
7. **Explainability & AI Insights:** View the assessment result. Click "Generate AI Insights" to invoke Gemini for a narrative translation of the metrics.
8. **Institutional Reporting:** Go to the Reports tab on the sidebar. Click "Export CSV" to download the faculty summary matrix.

## Fallback / Offline Workflow
* If the external Apify Google Scholar scraper fails, the backend will return a graceful error. Proceed to show the previously fetched publications already unified in the database.
* If the Gemini AI API times out, the backend gracefully falls back to deterministic rule-based explainability (e.g., extracting "Strengths: Citation Count > 500").
* The SIH demonstration can continue 100% uninterrupted without active external scraping by relying on the populated database.

## Known Limitations
* Real-time ResearchGate scraping is restricted by Cloudflare; currently operates via institutional upload CSV matching instead.
* Assessment calculations are immutable once "approved". A new assessment cycle must be created to re-evaluate changed data.
