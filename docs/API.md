# AcadLens — API Contract (Boundary Document)

> **Status**: Boundary document defining the contract between the Next.js frontend and the FastAPI backend.
> The backend is not yet implemented. Frontend types and API client stubs are based on these contracts.

---

## 1. API Conventions

- **Base URL**: `http://localhost:8000/api/v1` (development)
- **Auth**: JWT Bearer token in `Authorization: Bearer <token>` header
- **Format**: JSON request and response bodies
- **Errors**: Standard error envelope on all 4xx / 5xx responses
- **Versioning**: URL-based (`/api/v1/...`)

### Standard Error Envelope
```json
{
  "error": {
    "code": "CONFLICT_NOT_FOUND",
    "message": "No conflict with the specified ID exists.",
    "detail": null
  }
}
```

---

## 2. Authentication

### `POST /auth/login`
```json
// Request
{ "email": "admin@institution.ac.in", "password": "..." }

// Response 200
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "uuid", "name": "Dr. Admin", "role": "admin" }
}
```

### `POST /auth/refresh`
Refreshes the access token using a rotation cookie. No request body needed.

### `GET /auth/me`
Returns the currently authenticated user object.

---

## 3. Faculty Endpoints

### `GET /faculty`
Returns paginated faculty directory.

**Query params**: `page`, `limit`, `search`, `department`, `status`, `sort`

```json
// Response 200
{
  "items": [
    {
      "id": "uuid",
      "canonical_name": "Dr. Meera Pillai",
      "department": "Computer Science",
      "designation": "Associate Professor",
      "onboarding_status": "active",
      "completeness_score": 84.5,
      "conflict_count": 2,
      "last_synced_at": "2026-08-19T14:30:00Z",
      "source_coverage": {
        "google_scholar": true,
        "researchgate": false,
        "institutional": true
      }
    }
  ],
  "total": 148,
  "page": 1,
  "limit": 20
}
```

---

### `POST /faculty`
Creates a new faculty entity (onboarding).

```json
// Request
{
  "canonical_name": "Dr. Meera Pillai",
  "canonical_email": "meera.pillai@institution.ac.in",
  "department": "Computer Science",
  "designation": "Associate Professor",
  "institution": "National Institute of Technology",
  "scholar_id": "abc123XYZ"
}

// Response 201
{ "id": "uuid", "onboarding_status": "pending" }
```

---

### `GET /faculty/{id}`
Returns the full unified profile for a faculty member.

```json
// Response 200
{
  "entity": { /* faculty_entities row */ },
  "unified_profile": {
    "display_name": "Dr. Meera Pillai",
    "bio": "...",
    "research_interests": ["Machine Learning", "NLP"],
    "completeness_score": 84.5,
    "conflict_count": 2,
    "last_synced_at": "2026-08-19T14:30:00Z",
    "source_coverage": { "google_scholar": true, "researchgate": false }
  },
  "publications_count": 34,
  "latest_assessment": { /* partial assessment summary or null */ }
}
```

---

### `GET /faculty/{id}/publications`
Returns deduplicated publications for a faculty member.

**Query params**: `page`, `limit`, `year`, `dedup_status`

---

### `GET /faculty/{id}/conflicts`
Returns all detected data conflicts for review.

```json
// Response 200
{
  "items": [
    {
      "id": "uuid",
      "field_name": "h_index",
      "source_a": "google_scholar",
      "value_a": "22",
      "source_b": "researchgate",
      "value_b": "19",
      "resolution": "unresolved",
      "detected_at": "2026-08-19T14:30:00Z"
    }
  ]
}
```

---

### `PATCH /faculty/{id}/conflicts/{conflict_id}`
Resolves a data conflict.

```json
// Request
{
  "resolution": "source_a"  // or "source_b" | "manual"
}

// Response 200
{ "id": "uuid", "resolution": "source_a", "resolved_at": "..." }
```

---

## 4. Ingestion Endpoints

### `POST /ingestion/trigger`
Triggers an Apify actor run for a specific faculty and source.

```json
// Request
{
  "faculty_id": "uuid",
  "source": "google_scholar"
}

// Response 202
{
  "job_id": "apify-run-abc123",
  "status": "queued",
  "estimated_duration_seconds": 45
}
```

---

### `GET /ingestion/status/{job_id}`
Polls the status of an ingestion job.

```json
// Response 200
{
  "job_id": "apify-run-abc123",
  "status": "completed",    // queued | running | completed | failed
  "records_fetched": 34,
  "completed_at": "2026-08-19T14:31:12Z"
}
```

---

## 5. Assessment Endpoints

### `POST /assessment/run`
Triggers the rule engine for a faculty member. **Only the rule engine produces scores.**

```json
// Request
{ "faculty_id": "uuid" }

// Response 201
{
  "assessment_id": "uuid",
  "total_score": 187.5,
  "completeness_score": 84.5,
  "confidence_score": 79.2,
  "status": "draft"
}
```

---

### `GET /assessment/{assessment_id}`
Returns full assessment detail including per-KPI breakdown.

```json
// Response 200
{
  "id": "uuid",
  "faculty_id": "uuid",
  "assessed_at": "2026-08-19T15:00:00Z",
  "total_score": 187.5,
  "completeness_score": 84.5,
  "confidence_score": 79.2,
  "status": "draft",
  "kpi_scores": [
    {
      "rule_id": "publications.count",
      "rule_name": "Total Publication Count",
      "category": "Research Output",
      "raw_value": 34,
      "computed_score": 68.0,
      "max_score": 100.0,
      "rule_version": "1.0.0"
    }
  ],
  "ai_insights": {
    "insight_text": "Dr. Pillai demonstrates strong research output...",
    "generated_at": "2026-08-19T15:00:45Z",
    "is_advisory": true
  }
}
```

---

### `GET /assessment/{assessment_id}/evidence`
Returns the evidence trail for a specific assessment — links claims to source records.

---

### `PATCH /assessment/{assessment_id}/status`
Admin approval workflow.

```json
// Request
{ "status": "approved" }  // or "rejected"
```

---

## 6. Dashboard Endpoints

### `GET /dashboard/summary`
Returns platform-level metrics for the dashboard.

```json
// Response 200
{
  "faculty_total": 148,
  "faculty_active": 134,
  "assessments_this_cycle": 89,
  "avg_completeness": 71.3,
  "pending_conflicts": 43,
  "last_ingestion_at": "2026-08-19T12:00:00Z",
  "source_health": {
    "google_scholar": "healthy",
    "researchgate": "degraded",
    "institutional": "healthy"
  }
}
```
