# AcadLens
**AI-Enabled Academic Profile Analytics for Evidence-Based Faculty Assessment**

Smart India Hackathon 2026 — Problem Statement PS64

> 🚀 **Live Demo:** [Deploying to Vercel...] *(See deployment instructions below)*

---

## 📖 What is AcadLens?

AcadLens resolves fragmented faculty information — scattered across Google Scholar, ResearchGate, and institutional systems — into a single, evidence-backed, assessable academic profile. It provides academic institutions with an auditable platform to assess research output, track performance, and resolve data conflicts.

**Core Principle:**
> RULES CALCULATE.
> AI INTERPRETS.
> HUMANS DECIDE.

The deterministic rule engine computes all scores. The AI LLM generates interpretive narrative only. Humans make all consequential decisions.

---

## ✨ Prototype Features (Frontend MVP)

This repository contains the **Frontend-only Prototype** for the SIH 2026 submission. It utilizes deterministic mock data to demonstrate the platform's vision without requiring the backend AI or database dependencies.

- **Cinematic Landing Experience:** A pinned, scroll-driven visual story explaining the data pipeline (Ingestion → Resolution → Assessment).
- **Institution Dashboard:** A comprehensive view of the entire faculty network, data completeness, and overall assessment metrics.
- **Faculty Directory & Profiles:** Individual, detailed views for professors, tracking canonical publications vs. scraped data.
- **Conflict Resolution Engine:** Visual interface showing exactly where Google Scholar data conflicts with Institutional ERP data.
- **Deterministic Assessment Breakdown:** Transparent score rings and parameter bars explaining precisely *why* a faculty member received their assessment score.
- **Fully Responsive & Accessible:** Honors `prefers-reduced-motion` and scales perfectly from mobile to ultra-wide desktop.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, CSS Variables for "Premium Academic Theme" |
| **Animation Engine** | Framer Motion (Scroll-linked pipelines & micro-interactions) |
| **Charts & Viz** | Recharts, SVG inline visualization |
| **Icons** | Lucide React |
| **Backend** | *FastAPI (Python) — planned for Phase 2* |
| **Database** | *PostgreSQL / Supabase — planned for Phase 2* |
| **Ingestion** | *Apify — planned for Phase 2* |

---

## 🚀 Getting Started (Local Development)

### 1. Run the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Environment Variables

The current frontend prototype requires **no environment variables** to run. All mock data is bundled locally for demonstration purposes.

A template for future backend variables can be found in `frontend/.env.example`.

---

## ☁️ Deployment to Vercel

This repository is **Vercel Production Ready**.

1. Navigate to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project** and import this GitHub repository.
3. **CRITICAL SETTINGS:**
   - **Framework Preset**: Select `Next.js`
   - **Root Directory**: Type `frontend` and save.
4. Leave all build commands (`npm run build`) as default.
5. Click **Deploy**.

For more details, see [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md).

---

## 📂 Repository Structure

```
/
├── docs/                     # Architecture, design, and product specifications
│   ├── A3P_MASTER_SPEC.md
│   ├── DESIGN_SYSTEM.md
│   ├── ARCHITECTURE.md
│   ├── VERCEL_DEPLOYMENT.md
│   └── MVP_SCOPE.md
│
└── frontend/                 # Next.js 16 Application
    ├── app/                  # Application Routes (Landing, Dashboard, Faculty, Login)
    ├── components/           # Shared UI, Layouts, and Landing Page Modules
    ├── lib/                  # Utilities, Motion configs, Route definitions
    ├── mock-data/            # Deterministic TypeScript datasets for the MVP prototype
    ├── types/                # Shared TypeScript type definitions
    └── public/               # Static assets
```

---

## 📚 Technical Documentation

| Document | Purpose |
|---|---|
| [A3P_MASTER_SPEC.md](docs/A3P_MASTER_SPEC.md) | Product specification, pipeline, personas |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Color system (Navy, Teal, Gold), typography, motion rules |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Frontend and backend architecture |
| [DATABASE.md](docs/DATABASE.md) | PostgreSQL schema (boundary doc) |
| [MVP_SCOPE.md](docs/MVP_SCOPE.md) | SIH hackathon scope, demo requirements |

---

## 👥 Team
**SIH 2026 Team** — National Institute of Technology / [Institution Name]
