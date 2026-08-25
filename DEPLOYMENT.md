# ACADLENS — DEPLOYMENT GUIDE

This document outlines the exact deployment checklist and commands required to launch AcadLens into a production environment.

## 1. Supabase Configuration Checklist
Your Supabase project acts as the primary database and authentication provider.
- [ ] **Migrations:** Ensure all SQL migrations (`supabase/migrations/001` through `005`) are executed in the SQL Editor.
- [ ] **Schema Cache:** Run `NOTIFY pgrst, 'reload schema';` in the SQL Editor to ensure PostgREST exposes all newly created tables/columns.
- [ ] **Authentication:** Enable Email Auth (or OAuth providers as desired). In the Supabase Dashboard, set the **Site URL** and **Redirect URLs** to your final Vercel domain (e.g., `https://acadlens.vercel.app/*`).
- [ ] **Secrets:** Obtain the **Project URL**, **anon public key**, **service_role secret**, and **JWT secret** from Settings > API.

## 2. FastAPI Backend Deployment Checklist
The backend should be deployed to a provider that supports Docker or native Python ASGI apps (e.g., Render, Railway, AWS AppRunner).

- [ ] **Build Command:** `pip install -r requirements.txt`
- [ ] **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] **Environment Variables:**
  ```env
  SUPABASE_URL=https://<your-project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  SUPABASE_JWT_SECRET=<your-jwt-secret>
  APIFY_API_TOKEN=<your-apify-token>
  GEMINI_API_KEY=<your-gemini-key>
  CORS_ORIGINS=["https://your-vercel-domain.vercel.app"]
  ```
  *Note: `CORS_ORIGINS` must be a valid JSON array.*

## 3. Next.js Frontend Deployment Checklist (Vercel)
The frontend is optimized for Vercel's zero-config Next.js deployments.

- [ ] **Repository:** Connect your GitHub repository to Vercel.
- [ ] **Framework Preset:** Next.js (Auto-detected).
- [ ] **Build Command:** `npm run build`
- [ ] **Environment Variables:**
  ```env
  NEXT_PUBLIC_APP_NAME="AcadLens"
  NEXT_PUBLIC_APP_URL="https://your-vercel-domain.vercel.app"
  NEXT_PUBLIC_API_URL="https://your-backend-domain.onrender.com/api"
  NEXT_PUBLIC_SUPABASE_URL="https://<your-project>.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
  ```
- [ ] **Deployment:** Click Deploy. Vercel automatically handles the edge runtime and serverless functions used by `middleware.ts` and React Server Components.
