<div align="center">
  <h1>🎓 AcadLens (Faculty360)</h1>
  <p><b>AI-Enabled Academic Profile Analytics for Evidence-Based Faculty Assessment</b></p>
  <p><i>Smart India Hackathon 2026 — Problem Statement PS64</i></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
    <img src="https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" />
    <img src="https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel" />
    <img src="https://img.shields.io/badge/Gemini-AI-4285F4?logo=google" />
  </p>
</div>

---

## 🔍 What is AcadLens?

**AcadLens** solves the critical data fragmentation problem faced by higher education institutions during accreditation cycles (NAAC, NBA, NIRF). When accreditation bodies request faculty performance data, institutions typically spend weeks manually aggregating unverified spreadsheets from different departments.

AcadLens is an institutional **Single Source of Truth** — it automatically fetches, merges, deduplicates, and conflict-resolves academic data from multiple external sources (Google Scholar, ORCID, ResearchGate) and internal institutional records, then runs a deterministic, rule-based assessment engine to produce 100% verifiable faculty scores backed by a complete chain of evidence.

> **Core philosophy:** *Rules Calculate. AI Interprets. Humans Decide.*  
> Every score is mathematically deterministic and auditable. Gemini AI only provides advisory explanations on top of already-calculated scores — it never modifies them.

---

## ✨ Feature Overview

### 📊 Dashboard
- Real-time platform stats: total faculty, average assessment score, profile completeness, pending conflicts
- Source health monitoring (Google Scholar, ORCID, ResearchGate, Institutional)
- Recent activity timeline
- Quick-action shortcuts to common workflows

### 👥 Faculty Management
- Full faculty directory with search, filter by department, and sort options
- Per-faculty profile pages with tabbed views:
  - **Overview:** Biography, research interests, citation metrics, h-index, publication count, Gemini AI overview panel
  - **Institutional:** Internal records — projects, mentoring, students, institutional roles
  - **Research (22+):** All publications with source cross-references, citation counts, and duplicate detection
  - **Sources:** Per-source sync status (Google Scholar, ORCID, ResearchGate, Institutional CSV)
  - **Conflicts:** Detected data discrepancies between sources with resolution UI
- One-click source sync (Google Scholar URL → live data pull via OpenAlex/Semantic Scholar)
- Faculty profile creation with automatic publication ingestion

### 📈 Assessment Engine
- **Deterministic scoring** across 5 KPI categories:
  | Category | Examples |
  |---|---|
  | Research Output | Publication count, book chapters |
  | Publication Quality | Journal tier (Q1–Q4), conference rank |
  | Research Impact | Citations, h-index, i10-index |
  | Outreach & Extension | Projects, workshops, consultancy |
  | Academic Leadership | PhD supervision, admin roles, awards |
- Per-faculty assessment pages with:
  - **Radar chart** visualizing all 5 category scores
  - **Parameter breakdown bars** showing score vs. max for every individual KPI rule
  - **Historical trends line chart** showing score progression over time
  - **Gemini AI Insights panel** with strengths, improvement areas, data quality observations, and recommended actions
- Assessment approval/rejection workflow

### 📋 Assessments List
- Platform-wide view of all assessments across all faculty
- Filter by status (pending, approved, archived)
- Inline approval controls for ADMIN/REVIEWER roles

### 📑 Reports
- One-click **NAAC/NBA export** — generates a comprehensive institutional CSV with all faculty KPI scores
- Department-level aggregation reports
- Conflict summary reports

### ⚙️ Settings (Admin)
- **Assessment Framework Manager:** Create and edit KPI rule sets with custom weights, max scores, and evidence sources — without touching any code
- **AI Framework Advisor:** Gemini AI analyzes your current framework configuration and suggests improvements (missing parameters, redundant weights, evidence gaps)
- **User Management:** Role-based access control (ADMIN, REVIEWER, VIEWER)
- **Audit Log:** Full traceable history of every action taken in the system

### 🤖 Gemini AI Integration
- **Faculty Overview:** Natural-language 2–3 sentence bio generated from verified profile data
- **Assessment Insights:** Detailed report with key insights, strengths, improvement areas, data quality observations, and recommended actions
- **Framework Advisor:** Reviews your KPI framework config and suggests optimizations
- All AI output is clearly labelled **"Advisory Only"** — scores are never modified by AI

### 🔗 Conflict Resolution Engine
- Automatically detects cross-source discrepancies (e.g., citation count mismatch between Google Scholar and ORCID)
- Calculates a **Data Confidence Score** per profile
- Interactive conflict resolution UI (accept Source A, accept Source B, or enter manual value)

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Vercel (Production)                       │
│                                                              │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │   Next.js Frontend  │    │   FastAPI Python Backend   │  │
│  │  (App Router, SSR)  │◄──►│   (Serverless via /api/*)  │  │
│  │  /dashboard         │    │   /api/faculty              │  │
│  │  /faculty/[id]      │    │   /api/assessment           │  │
│  │  /assessments       │    │   /api/dashboard            │  │
│  │  /reports           │    │   /api/reports              │  │
│  │  /settings          │    │   /api/health               │  │
│  └─────────────────────┘    └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  Supabase (Database) │
               │  PostgreSQL + RLS    │
               │  JWT Authentication  │
               └──────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
    Google Scholar     ORCID      Semantic Scholar
    (OpenAlex API)   (REST API)   (Academic Graph)
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **UI/Animations** | Framer Motion, Lucide React, Recharts |
| **Backend** | FastAPI (Python), httpx, pydantic-settings |
| **Database** | Supabase (PostgreSQL + Row Level Security) |
| **Authentication** | Supabase Auth (JWT) |
| **AI** | Google Gemini 1.5 Flash (advisory layer only) |
| **Data Sources** | OpenAlex API, Semantic Scholar API, ORCID REST API |
| **Hosting** | Vercel (frontend + Python serverless functions) |
| **CI/CD** | GitHub Actions → Vercel CLI |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- A Supabase project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/piyushmarkandey1-ui/Faculty360.git
cd Faculty360

# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Environment Setup

**Backend** — create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-key        # Optional — falls back to mock
APIFY_API_TOKEN=                      # Optional
CORS_ORIGINS=["http://localhost:3000"]
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Database Setup

Run the migrations in your Supabase SQL Editor:
```bash
# Apply all migrations
ls supabase/migrations/*.sql  # run each in order in Supabase SQL Editor
```

### 4. Run Locally

```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Vercel Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions. Quick summary:

1. Import this repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `./` (repo root)
3. Set **Framework** to `Next.js`
4. Add these **Environment Variables** in Vercel Project Settings:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `NEXT_PUBLIC_API_URL` | ✅ | Set to `https://your-domain.vercel.app/api` |
| `SUPABASE_URL` | ✅ | Same as public URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role secret |
| `SUPABASE_JWT_SECRET` | ✅ | Supabase JWT secret |
| `GEMINI_API_KEY` | ⚡ Optional | Enables real Gemini AI insights |
| `APIFY_API_TOKEN` | ⚡ Optional | Google Scholar scraping |

5. Click **Deploy** — Vercel auto-deploys on every push to `main`

---

## 📁 Project Structure

```
Faculty360/
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── (app)/          # Authenticated routes (sidebar layout)
│   │   │   ├── dashboard/
│   │   │   ├── faculty/[id]/
│   │   │   ├── assessments/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── login/          # Auth page
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/         # AppShell, Sidebar
│   │   └── ui/             # Badge, Button, Card, ScoreRing, ParameterBar, etc.
│   ├── lib/
│   │   ├── api/client.ts   # Typed API fetch wrappers
│   │   └── supabase/       # Client + server Supabase helpers
│   └── types/              # TypeScript type definitions
├── backend/                # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # Route handlers (faculty, assessment, dashboard, reports)
│   │   ├── core/           # Config, auth, Supabase client
│   │   └── services/       # Assessment engine, AI insights, auto-ingest
│   └── requirements.txt
├── api/
│   └── index.py            # Vercel Python serverless entry point
├── supabase/
│   └── migrations/         # SQL schema migrations
├── vercel.json             # Vercel build configuration
└── DEPLOYMENT.md           # Full deployment guide
```

---

## 👥 Team

| | |
|---|---|
| **Hackathon** | Smart India Hackathon 2026 |
| **Problem Statement** | PS64 — Faculty Performance Analytics |
| **Team** | Faculty360 |

---

<div align="center">
  <sub>Built with ❤️ for SIH 2026 — <i>Rules Calculate. AI Interprets. Humans Decide.</i></sub>
</div>
