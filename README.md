# A³P-Web

**AI-Enabled Academic Profile Analytics Using Multi-Source Public Web and Institutional Data**

Smart India Hackathon 2026 — Problem Statement PS64

---

## What is A³P-Web?

A³P-Web resolves fragmented faculty information — scattered across Google Scholar, ResearchGate, and institutional systems — into a single, evidence-backed, assessable academic profile.

**Core Principle:**

```
RULES CALCULATE.
AI INTERPRETS.
HUMANS DECIDE.
```

The rule engine computes all scores. The LLM generates interpretive narrative only. Humans make all consequential decisions.

---

## Repository Structure

```
/
├── docs/                     # Architecture, design, and product specifications
│   ├── A3P_MASTER_SPEC.md
│   ├── DESIGN_SYSTEM.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DATA_SOURCES.md
│   ├── ASSESSMENT_ENGINE.md
│   └── MVP_SCOPE.md
│
├── frontend/                 # Next.js 14 + TypeScript + Tailwind CSS
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── styles/
│
├── backend/                  # FastAPI + PostgreSQL (not yet implemented)
│
├── CONVENTIONS.md            # Coding standards and commit conventions
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | FastAPI (Python) — planned |
| Database | PostgreSQL / Supabase — planned |
| Ingestion | Apify — planned |
| AI | LLM API (advisory only) — planned |

---

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

> Not yet implemented. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the planned FastAPI setup.

---

## Documentation

| Document | Purpose |
|---|---|
| [A3P_MASTER_SPEC.md](docs/A3P_MASTER_SPEC.md) | Product specification, pipeline, personas |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Color system, typography, motion rules |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Frontend and backend architecture |
| [DATABASE.md](docs/DATABASE.md) | PostgreSQL schema (boundary doc) |
| [API.md](docs/API.md) | FastAPI endpoint contracts (boundary doc) |
| [DATA_SOURCES.md](docs/DATA_SOURCES.md) | Apify integration, source registry, normalization |
| [ASSESSMENT_ENGINE.md](docs/ASSESSMENT_ENGINE.md) | Rule engine, KPI framework, AI boundary |
| [MVP_SCOPE.md](docs/MVP_SCOPE.md) | SIH hackathon scope, demo requirements |

---

## Team

SIH 2026 Team — National Institute of Technology / [Institution Name]
