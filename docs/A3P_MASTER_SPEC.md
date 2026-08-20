# A³P-Web — Master Product Specification

> **Smart India Hackathon 2026 | Problem Statement PS64**
> AI-Enabled Academic Profile Analytics Using Multi-Source Public Web and Institutional Data

---

## 1. Problem Statement

Faculty information in Indian higher education institutions is fragmented across:

- Public academic platforms (Google Scholar, ResearchGate, ORCID)
- Institutional systems (ERP, LMS, HR databases)
- Self-reported, manually submitted appraisal forms

This fragmentation produces:

- **Inconsistency** — the same faculty member has different names, affiliations, and publication lists across platforms
- **Incompleteness** — no single system has a complete picture
- **Unverifiability** — claims on appraisal forms cannot be cross-validated efficiently
- **Manual burden** — administrators spend significant time collecting, reconciling, and validating data

---

## 2. The A³P-Web Solution

**A³P-Web** (AI-Enabled Academic Profile Analytics Platform) resolves fragmented faculty data into a single, evidence-backed, assessable profile.

The platform:

1. **Discovers** faculty presence across public and institutional data sources
2. **Resolves identity** across sources using deterministic and probabilistic matching
3. **Normalizes** heterogeneous data into a unified schema
4. **Detects duplicates and conflicts** with full provenance tracking
5. **Computes metrics** using a configurable, deterministic rule engine
6. **Generates insights** using AI — for interpretation only, never for score calculation
7. **Produces explainable, auditable assessments** for institutional use

---

## 3. Core Principle

```
RULES CALCULATE.
AI INTERPRETS.
HUMANS DECIDE.
```

This is non-negotiable architecture:

| Layer | Responsibility | Technology |
|---|---|---|
| **Rule Engine** | Calculates all official scores, KPIs, completeness indicators | Deterministic Python logic |
| **AI Layer** | Generates narrative summaries, flags anomalies, suggests improvements | LLM API (read-only, advisory) |
| **Human Layer** | Reviews evidence, approves assessments, overrides decisions | Admin UI |

The LLM **must never** be the source of a numeric score, a promotion recommendation, or any value used in an official appraisal computation.

---

## 4. Data Sources

### Phase 1 (MVP — SIH)
| Source | Access Method | Data Extracted |
|---|---|---|
| Google Scholar | Apify Actor | Publications, citations, h-index, co-authors |
| ResearchGate | Apify Actor (future) | Publications, reads, followers |
| Institutional Data | CSV / API upload (admin) | Employment, designation, course load |

### Future Phases
| Source | Access Method |
|---|---|
| ORCID Public API | REST API |
| Scopus | Elsevier API (institutional license) |
| Web of Science | Clarivate API |
| Shodhganga | Scraping / API |
| Patent databases | REST API |

---

## 5. System Pipeline

```
[ Google Scholar ]  ──┐
[ ResearchGate    ]  ──┤
[ Institutional   ]  ──┤──▶  [ Ingestion Layer ]
[ Future Sources  ]  ──┘          │
                                   ▼
                          [ Identity Resolution ]
                                   │
                                   ▼
                          [ Data Normalization ]
                                   │
                                   ▼
                     [ Duplicate & Conflict Detection ]
                                   │
                                   ▼
                        [ Unified Faculty Profile ]
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼               ▼
             [ Rule Engine ]  [ AI Layer ]  [ Evidence Store ]
                    │              │               │
                    ▼              ▼               │
             [ KPI Scores ]  [ Insights ]         │
                    └──────────────┴───────────────┘
                                   │
                                   ▼
                        [ Assessment Report ]
                                   │
                                   ▼
                           [ Admin Review ]
```

---

## 6. Stakeholder Personas

| Persona | Role | Primary Use Case |
|---|---|---|
| **Institution Admin** | Platform operator | Onboard faculty, configure sources, review assessments |
| **Department Head** | Reviewer | Validate faculty profiles, approve assessments for their dept |
| **Faculty Member** | Subject | View own profile, correct errors, track completeness |
| *(Future)* **Accreditation Auditor** | External reviewer | Export evidence packages for NAAC/NIRF |

---

## 7. Product Routes

| Route | Purpose |
|---|---|
| `/login` | Admin authentication |
| `/dashboard` | Platform overview, ingestion status, system health |
| `/faculty` | Faculty directory with search, filter, completeness indicators |
| `/faculty/new` | Faculty onboarding form |
| `/faculty/[id]` | Unified faculty profile view |
| `/faculty/[id]/review` | Data review — source conflicts, duplicates, evidence |
| `/faculty/[id]/assessment` | KPI scores, rule breakdown, AI insights |
| `/assessment/[id]/evidence` | Evidence trail for a specific assessment claim |

---

## 8. Quality Indicators

Every faculty profile exposes:

- **Data Completeness Score** — % of expected fields populated across sources
- **Source Coverage** — how many configured sources have been successfully queried
- **Conflict Count** — number of unresolved data conflicts between sources
- **Assessment Confidence** — derived from completeness + conflict resolution status
- **Last Synced** — timestamp of most recent data ingestion per source

---

## 9. Non-Goals (MVP)

- Real-time scraping (async batch jobs only)
- Direct Scopus / WoS paid API calls
- Student feedback / 360-degree appraisal
- Native mobile application
- Multi-tenant SaaS
- Public-facing faculty profiles
