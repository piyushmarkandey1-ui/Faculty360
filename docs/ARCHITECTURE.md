# A³P-Web — Architecture Specification

---

## 1. High-Level Architecture

A³P-Web is a two-tier application with a clear boundary between a **Next.js frontend** and a **FastAPI backend**. The frontend is a complete SSR/SPA hybrid that handles all UI and calls the FastAPI backend for data. The backend owns all data access, ingestion orchestration, rule engine computation, and AI API calls.

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
│                                                                 │
│   Next.js 14 (App Router)  ·  TypeScript  ·  Tailwind CSS      │
│   Framer Motion  ·  Recharts  ·  Lucide Icons                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │  HTTPS / REST
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                             │
│                                                                 │
│              FastAPI (Python)  ·  Pydantic v2                   │
│              JWT Authentication  ·  Async handlers              │
└────────┬───────────────┬────────────────┬───────────────────────┘
         │               │                │
         ▼               ▼                ▼
  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐
  │  PostgreSQL  │ │ Apify Cloud  │ │   AI/LLM API  │
  │  (Supabase) │ │  (Actors)    │ │  (read-only)  │
  └─────────────┘ └──────────────┘ └───────────────┘
```

---

## 2. Frontend Architecture

### Framework Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14, App Router | SSR for institutional dashboards, file-based routing matches product routes exactly |
| Language | TypeScript (strict) | Catches schema mismatches early; critical for data-heavy application |
| Styling | Tailwind CSS v3 | Utility-first with design tokens via CSS custom properties; no CSS-in-JS overhead |
| Animation | Framer Motion | Best-in-class declarative animation API for React; `AnimatePresence` for route transitions |
| Charts | Recharts | Composable, React-native, accessible; good enough for MVP analytics |
| Icons | Lucide React | Consistent stroke system, tree-shakeable |

### Folder Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout — font, metadata, providers
│   ├── page.tsx                  # Landing page (/)
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── faculty/
│   │   ├── page.tsx              # Faculty directory
│   │   ├── new/
│   │   │   └── page.tsx          # Faculty onboarding
│   │   └── [id]/
│   │       ├── page.tsx          # Faculty profile
│   │       ├── review/
│   │       │   └── page.tsx      # Data review
│   │       └── assessment/
│   │           └── page.tsx      # Assessment view
│   └── assessment/
│       └── [id]/
│           └── evidence/
│               └── page.tsx      # Evidence trail
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Primitive components (Button, Badge, Card, etc.)
│   ├── layout/                   # Shell, Sidebar, Header, PageHeader
│   ├── faculty/                  # FacultyCard, ProfileHeader, SourceBadge
│   ├── assessment/               # ScoreCard, RuleBreakdown, EvidenceItem
│   ├── charts/                   # WrappedRecharts components with motion
│   └── motion/                   # Reusable Framer Motion wrappers
│
├── lib/                          # Non-UI utilities
│   ├── api/                      # API client functions (typed fetch wrappers)
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Formatting, date, string utilities
│   └── constants/                # App-wide constants (routes, config)
│
├── types/                        # TypeScript type definitions
│   ├── faculty.ts
│   ├── assessment.ts
│   ├── sources.ts
│   └── api.ts                    # API response/request types
│
├── styles/
│   ├── globals.css               # Tailwind directives + global resets
│   └── tokens.css                # CSS custom properties (design tokens)
│
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind config extending design tokens
├── next.config.ts
└── tsconfig.json
```

### Routing Architecture

All routes use the App Router. Route segments map directly to the product flow:

```
/ (landing)
├── /login
├── /dashboard
└── /faculty
    ├── /new
    └── /[id]
        ├── /review
        └── /assessment
            └── /[assessmentId]/evidence  (via /assessment/[id]/evidence)
```

### Data Fetching Strategy

| Route | Strategy | Reason |
|---|---|---|
| `/dashboard` | Server Component + `fetch` | Static shell, data from API at render time |
| `/faculty` | Server Component + searchParams | Directory is paginated, server-filtered |
| `/faculty/[id]` | Server Component | Profile data rendered on server for SEO and speed |
| `/faculty/[id]/review` | Client Component | Interactive conflict resolution requires state |
| `/faculty/[id]/assessment` | Server + Client hybrid | Static scores on server; interactive AI insights client-side |

---

## 3. Backend Architecture (Boundary Document — Not Yet Implemented)

### Framework

**FastAPI** (Python 3.11+) with Pydantic v2 for schema validation.

### Service Modules

```
backend/
├── app/
│   ├── main.py                   # FastAPI app instance, router registration
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── faculty.py
│   │   │   ├── sources.py
│   │   │   ├── ingestion.py
│   │   │   ├── assessment.py
│   │   │   └── insights.py
│   ├── core/
│   │   ├── config.py             # Settings from environment variables
│   │   ├── security.py           # JWT handling
│   │   └── database.py           # Supabase/SQLAlchemy session
│   ├── models/                   # SQLAlchemy ORM models
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── services/
│   │   ├── ingestion/            # Apify actor calls, data parsing
│   │   ├── identity/             # Identity resolution logic
│   │   ├── normalization/        # Source-to-unified schema mapping
│   │   ├── deduplication/        # Duplicate detection algorithms
│   │   ├── rule_engine/          # Deterministic KPI calculations — RULES CALCULATE
│   │   └── ai/                   # LLM API calls for insights — AI INTERPRETS
│   └── workers/                  # Background job handlers (Celery / ARQ)
│
├── tests/
├── alembic/                      # Database migrations
├── requirements.txt
└── .env.example
```

### Key Architectural Constraint

The `rule_engine/` module and the `ai/` module are **deliberately separated**:

- `rule_engine/` outputs `AssessmentResult` — numeric, deterministic, auditable
- `ai/` receives `AssessmentResult` as input and outputs `InsightText` — narrative, advisory
- `ai/` cannot modify any value in `AssessmentResult`
- This boundary is enforced at the type level with Pydantic models

---

## 4. Data Flow

```
Admin triggers ingestion
         │
         ▼
Apify Actor called via API
         │
         ▼
Raw data stored in source_records table
         │
         ▼
Identity Resolution service matches records to faculty entity
         │
         ▼
Normalization maps source fields → unified_profile schema
         │
         ▼
Deduplication checks for conflicts within and across sources
         │
         ▼
Unified Profile updated, conflict_log written
         │
         ▼
Rule Engine computes KPI scores from unified profile
         │
         ▼
Assessment record created (immutable snapshot)
         │
         ▼
AI service reads assessment + profile → generates insight text
         │
         ▼
Admin reviews in /faculty/[id]/assessment
```

---

## 5. Environment Configuration

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Backend (.env)
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...
APIFY_API_TOKEN=...
AI_API_KEY=...
JWT_SECRET=...
```

---

## 6. Development Tooling

| Tool | Purpose |
|---|---|
| ESLint + Prettier | Frontend linting and formatting |
| Ruff + Black | Backend linting and formatting |
| Husky + lint-staged | Pre-commit hooks |
| TypeScript strict mode | Type safety on frontend |
| Pydantic v2 strict | Schema validation on backend |
