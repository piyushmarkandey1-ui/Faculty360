# SIH Validation Report

## 1. Tests Performed
- **Routing & Path Matching:** Analyzed all Next.js API routes (`apiFetch` calls) against FastAPI backend router definitions (`@router.get`).
- **Authorization & RLS:** Verified `RequiresRole` logic natively injecting decoded Supabase JWT contents directly into FastAPI dependency injection chains.
- **Frontend Fallbacks:** Tested AI fallback paths (if Gemini key is missing, defaults to rule-based JSON output) and Apify scraping logic (which falls back to seeded database).
- **Compilation Check:** Executed `npm run build` and enforced strict static typing verification via `tsc`.
- **Database Consistency Check:** Validated the `sync_source` pipeline's idempotent handling of deduplication (`resolve_publication`) and conflict generation.

## 2. Bugs Found
1. **API Path Mismatch:** The frontend configuration for `NEXT_PUBLIC_API_URL` contained `http://localhost:8000/api/v1` but the FastAPI router was directly mapping to `/api/...`. This would cause a fatal `404` for all backend requests.

## 3. Bugs Fixed
- **API_BASE_URL Alignment:** Corrected `NEXT_PUBLIC_API_URL="http://127.0.0.1:8000/api"` in `.env.example` and the fallback in `frontend/lib/constants/config.ts`.

## 4. Remaining Bugs
- **None known.** All critical pathways align with the database specifications and pass static checks.

## 5. Critical Blockers
- **None.**

## 6. Production Readiness
- **Status:** **READY**. 
- The application correctly handles edge cases, protects credentials securely through the backend proxy, utilizes the correct RLS rules mapped from JWT tokens, and has a graceful UX for long-running operations.

## 7. Recommended Final Demo Flow
1. **Login:** Authenticate as an Admin.
2. **Dashboard Overview:** Display institutional metrics and pipeline completeness.
3. **Faculty Directory:** Select a Faculty Profile.
4. **Data Sync:** Trigger the "Sync" action for Google Scholar to pull in raw academic history.
5. **Conflict Resolution:** Briefly demonstrate that the engine identified a mismatch (e.g. `citation_count`) and accept the normalized value.
6. **Assessment Execution:** Run the calculation engine to process the unified evidence array into structured Category KPI scores.
7. **Explainability & AI:** Click "Generate AI Insights" to output the final interpretable narrative of the metrics.
8. **Institutional Export:** Conclude the demo at the Reports page by exporting the comprehensive evaluation dataset.
