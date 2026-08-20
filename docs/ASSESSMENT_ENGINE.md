# A³P-Web — Assessment Engine Specification

---

## 1. Foundational Constraint

```
RULES CALCULATE.
AI INTERPRETS.
HUMANS DECIDE.
```

This document specifies the **rule engine** component. The AI layer is documented separately. The two must never be merged.

The rule engine:
- Is deterministic and reproducible
- Produces the same output given the same input
- Has a version identifier on every rule
- Never calls an LLM
- Is fully auditable

The AI layer:
- Reads the rule engine output
- Generates natural language interpretation only
- Cannot modify any score
- Its output is stored with `is_advisory = TRUE` enforced at the schema level

---

## 2. Assessment Pipeline

```
unified_profile (input)
       │
       ▼
 ┌─────────────────────────────────┐
 │         Rule Engine             │
 │                                 │
 │  for each active KPI rule:      │
 │    1. Extract raw value(s)      │
 │       from unified_profile      │
 │    2. Apply scoring function    │
 │    3. Record evidence links     │
 │    4. Produce kpi_score record  │
 └─────────────────────────────────┘
       │
       ▼
  AssessmentResult
  ├── total_score (sum of all kpi_scores)
  ├── completeness_score
  ├── confidence_score
  └── kpi_scores[] (individual rule outputs)
       │
       ▼
  ┌─────────────────┐
  │   AI Layer      │  ← reads AssessmentResult (read-only)
  │  (LLM API)      │
  └─────────────────┘
       │
       ▼
  InsightText (advisory narrative, stored separately)
       │
       ▼
  Human Review in /faculty/[id]/assessment
```

---

## 3. KPI Framework

KPIs are organized into **categories**. Each category has a configured **maximum score**. The category structure is configurable by institution administrators.

### Default Category Structure (MVP)

| Category ID | Category Name | Max Score |
|---|---|---|
| `research_output` | Research Output | 100 |
| `publication_quality` | Publication Quality | 80 |
| `research_impact` | Research Impact | 60 |
| `profile_completeness` | Profile Completeness | 30 |
| `source_coverage` | Source Coverage | 30 |

---

## 4. KPI Rule Definitions (MVP Rule Set v1.0.0)

Each rule has:
- A stable `rule_id` — never changes between versions
- A `rule_version` — changes when logic changes
- A `scoring_function` — pure function, no side effects
- An `evidence_extractor` — identifies which source records contributed

---

### Category: Research Output

#### Rule: `research_output.publication_count`
```
Name: Total Verified Publications
Version: 1.0.0
Input: count of publications where dedup_status = 'unique'

Scoring function:
  raw_value  0       → score 0
  raw_value  1–5     → score = raw_value × 2
  raw_value  6–15    → score = 10 + (raw_value - 5) × 3
  raw_value  16–30   → score = 40 + (raw_value - 15) × 2
  raw_value  31+     → score = 70 + min((raw_value - 30), 10) × 1
  max_score  = 100

Rationale: Diminishing returns above 30 publications prevents 
           outlier score inflation.
```

---

### Category: Publication Quality

#### Rule: `publication_quality.venue_tier`
```
Name: Publication Venue Quality
Version: 1.0.0
Input: publications with known venue + tier classification

Tier classification (configurable):
  Tier A: Known top-10% venues (SJR Q1 / CORE A* / A)
  Tier B: Known mid-tier venues (SJR Q2 / CORE B)
  Tier C: Other indexed venues
  Tier D: Non-indexed / unknown

Scoring function (per publication):
  Tier A → 4 points
  Tier B → 2 points
  Tier C → 1 point
  Tier D → 0 points

max_score = 80
Note: Tier classification database is a separate configuration table.
      In MVP, tiers are manually tagged by admin.
      In Phase 3, auto-classified via Scopus SJR data.
```

---

### Category: Research Impact

#### Rule: `research_impact.h_index`
```
Name: H-Index Score
Version: 1.0.0
Input: metrics.h_index from unified_profile
       (resolved value after conflict resolution, or source_a if unresolved)

Scoring function:
  h_index 0        → score 0
  h_index 1–5      → score = h_index × 3
  h_index 6–10     → score = 15 + (h_index - 5) × 4
  h_index 11–20    → score = 35 + (h_index - 10) × 2
  h_index 21+      → score = 55 + min((h_index - 20), 5) × 1
  max_score = 60
```

#### Rule: `research_impact.total_citations`
```
Name: Total Citation Count
Version: 1.0.0
Input: metrics.total_citations from unified_profile

Scoring function:
  0        → 0
  1–50     → score = citations × 0.2
  51–200   → score = 10 + (citations - 50) × 0.1
  201–500  → score = 25 + (citations - 200) × 0.05
  500+     → score = 40 (capped)
  max_score = 40 (sub-component of research_impact)

Note: This rule contributes to research_impact category alongside h_index.
      Combined max = 60.
```

---

### Category: Profile Completeness

#### Rule: `profile_completeness.field_coverage`
```
Name: Unified Profile Field Coverage
Version: 1.0.0
Input: unified_profile fields

Required fields (each worth equal weight):
  - display_name, department, designation, institution (institutional)
  - h_index, total_citations (research metrics)
  - research_interests (at least 1)
  - at least 1 publication
  - at least 1 source synced in last 90 days

Scoring function:
  score = (fields_present / total_required_fields) × 30
  max_score = 30
```

---

### Category: Source Coverage

#### Rule: `source_coverage.active_sources`
```
Name: Active Source Coverage
Version: 1.0.0
Input: source_coverage map from unified_profile

Scoring function:
  Each active source = 10 points
  Active = source_records entry exists AND fetched_at within 90 days
  max_score = 30 (3 MVP sources × 10)
```

---

## 5. Derived Scores

### Completeness Score
```
completeness_score = (fields_present / expected_fields) × 100
```
Always 0–100. Displayed on every faculty card. Not part of the main assessment score — it's a data quality indicator.

---

### Confidence Score
```
confidence_score = completeness_score
                   × conflict_resolution_factor
                   × source_coverage_factor

conflict_resolution_factor = 1 - (unresolved_conflicts / total_conflicts) × 0.4
  (Unresolved conflicts reduce confidence by up to 40%)

source_coverage_factor = active_sources / total_configured_sources
```
Always 0–100. Indicates how much the assessment result can be trusted.

---

## 6. Rule Engine Implementation Notes

```python
# Each rule implements this interface
class KPIRule(Protocol):
    rule_id: str
    rule_version: str
    category: str
    max_score: float

    def extract_value(self, profile: UnifiedProfile) -> float | int: ...
    def compute_score(self, raw_value: float | int) -> float: ...
    def extract_evidence(self, profile: UnifiedProfile) -> list[EvidenceRef]: ...
```

Rules are registered in a `RULE_REGISTRY` dict. The assessment service iterates over registered rules, never calling the AI layer.

The AI service is called **after** the rule engine completes and receives the `AssessmentResult` as a read-only input.

---

## 7. Versioning & Immutability

- Every `kpi_score` record stores `rule_version`
- When a rule changes version, past assessments are unaffected
- Re-assessment generates a new `assessments` record — the old one is preserved
- The `profile_snapshot JSONB` in `assessments` preserves the exact profile state at assessment time
