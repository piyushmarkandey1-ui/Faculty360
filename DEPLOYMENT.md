# ACADLENS (FACULTY360) — VERCEL DEPLOYMENT GUIDE

This document outlines how to deploy both the **Next.js Frontend** and the **FastAPI Python Backend** together on **`https://faculty360.vercel.app`**.

---

## Architecture on Vercel

```
                                 https://faculty360.vercel.app
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     │                                                 │
            Next.js Frontend Routes                           FastAPI Backend API
       (/, /dashboard, /faculty, etc.)                             (/api/*)
                     │                                                 │
            Static & SSR Pages                               Python Serverless Functions
            (Edge / Node Runtime)                                 (api/index.py)
```

---

## 1. Unified Vercel Deployment (One-Click)

The repository is pre-configured with `vercel.json` to build the Next.js app and Python API routes simultaneously.

### Step 1: Import Repository in Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import this repository (`Faculty360`).
2. Project Name: **`faculty360`** (will provide `https://faculty360.vercel.app`).
3. Framework Preset: **Next.js** (Auto-detected).
4. Root Directory: **`./`** (leave as default root).

### Step 2: Configure Environment Variables in Vercel
In the Vercel Project Settings > **Environment Variables**, add:

| Variable | Description | Example / Note |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Application Name | `AcadLens` |
| `NEXT_PUBLIC_APP_URL` | Production Domain | `https://faculty360.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Frontend API Base | `https://faculty360.vercel.app/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://your-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | `your-anon-public-key` |
| `SUPABASE_URL` | Backend Supabase URL | `https://your-ref.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secret Key | `your-service-role-secret` |
| `SUPABASE_JWT_SECRET` | Supabase JWT Secret | `your-jwt-secret` |
| `SERPAPI_API_KEY` | Live Google Scholar API Key | *(Optional)* Recommended for high volume |
| `APIFY_API_TOKEN` | Apify Actor Token | *(Optional)* |
| `GEMINI_API_KEY` | Gemini AI Insights Key | *(Optional)* |

### Step 3: Click "Deploy"
Vercel will:
1. Compile the Next.js application into `frontend/.next`.
2. Bundle Python Serverless Functions from `api/index.py` using `@vercel/python`.
3. Route `https://faculty360.vercel.app` to the frontend and `https://faculty360.vercel.app/api/*` to the FastAPI backend!

---

## 2. Supabase Configuration

In your Supabase Dashboard:
1. **Migrations:** Run the SQL scripts in `supabase/migrations/` (or `combined_schema.sql`) in the Supabase SQL Editor.
2. **Auth Redirect URLs:** In **Authentication > URL Configuration**, set:
   - **Site URL:** `https://faculty360.vercel.app`
   - **Redirect URLs:** `https://faculty360.vercel.app/**` and `http://localhost:3000/**`

