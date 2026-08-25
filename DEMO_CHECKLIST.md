# AcadLens SIH Demo Checklist

## Prerequisites
1. **Database & Auth:** Supabase instance running.
2. **Backend:** FastAPI running locally (`uvicorn app.main:app --reload`).
3. **Frontend:** Next.js application running (`npm run dev`).

## Environment Setup
* `backend/.env`: Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. (Leave `APIFY_API_TOKEN` empty to trigger the built-in Mock Demo fallback).
* `frontend/.env.local`: Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL="http://127.0.0.1:8000/api"`.

## Demo Account & Seed Data
1. Sign up a new user via the UI (`/login`).
2. Go to Supabase SQL Editor and run:
   ```sql
   UPDATE profiles SET role = 'ADMIN' WHERE email = 'your_email@example.com';
   ```
3. Run the backend seed script to generate a clean demo target:
   ```bash
   cd backend
   python scripts/seed_demo_faculty.py
   ```

## Exact Demo Click Sequence
1. **Login:** Log in with the Admin account.
2. **Dashboard Overview:** Point out the aggregated institutional metrics.
3. **Faculty Directory:** Click "Faculty" in the sidebar. You will see "Demo Faculty".
4. **Faculty Profile:** Click on "Demo Faculty".
5. **Google Scholar Sync:** 
   - Click **Connect** on Google Scholar.
   - Enter `demo_id` and click **Sync**.
   - *(Since APIFY_API_TOKEN is empty, it will seamlessly fall back to our mock dataset, injecting a publication with 450 citations).*
6. **ORCID Sync:** 
   - Click **Connect** on ORCID.
   - Enter `0000-0000-0000-0000` and click **Sync**.
   - *(It will fall back to our mock ORCID dataset, injecting the exact same publication but with 0 citations).*
7. **Conflict Resolution:** 
   - Navigate to the **Review Conflicts** page (or click the alert banner).
   - Point out that the system detected a duplicate publication ("Machine Learning for Geospatial Data Analysis") but noticed a conflict in citation counts (450 vs 0).
   - Click "Accept Scholar Data" to resolve the conflict and merge the records.
8. **Data Quality & Evidence:** Go back to the profile, click **Assessment**, then **View Evidence**. Show how the resolved publication maps to the `research_output` KPI.
9. **Calculate Assessment:** Click **Recalculate Assessment**. Show the detailed scoring breakdown across Research, Teaching, etc.
10. **Explainability & AI Insights:** Click **Generate AI Insights**. It will generate a deterministic narrative explaining *why* they got the score (e.g. Strength: Citation count > 400).
11. **Institutional Reporting:** Go to the **Reports** tab on the sidebar. Click "Export CSV" to download the final evaluation matrix.

## Fallback Reliability
* External APIs (Scholar, ORCID, Gemini) are entirely wrapped in graceful degradation blocks. The UI and UX will continue to function 100% seamlessly offline or under rate limits by injecting the controlled `Machine Learning for Geospatial Data Analysis` conflict scenario.
