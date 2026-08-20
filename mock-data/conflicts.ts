import type { ProfileConflict } from '../frontend/types/faculty';

export const MOCK_CONFLICTS: ProfileConflict[] = [
  {
    id: "conf-1",
    faculty_id: "faculty-001",
    field_name: "h_index",
    source_a: "google_scholar",
    value_a: "22",
    source_b: "researchgate",
    value_b: "19",
    resolution: "unresolved",
    resolved_by: null,
    resolved_at: null,
    detected_at: "2026-08-19T10:00:00Z"
  },
  {
    id: "conf-2",
    faculty_id: "faculty-001",
    field_name: "affiliation",
    source_a: "orcid",
    value_a: "National Institute of Technology, Warangal",
    source_b: "institutional",
    value_b: "NIT Warangal",
    resolution: "source_b",
    resolved_by: "admin",
    resolved_at: "2026-08-19T11:30:00Z",
    detected_at: "2026-08-19T10:00:00Z"
  },
  {
    id: "conf-3",
    faculty_id: "faculty-002",
    field_name: "publication_year",
    source_a: "google_scholar",
    value_a: "2023",
    source_b: "researchgate",
    value_b: "2024",
    resolution: "unresolved",
    resolved_by: null,
    resolved_at: null,
    detected_at: "2026-08-15T11:00:00Z"
  },
  {
    id: "conf-4",
    faculty_id: "faculty-002",
    field_name: "total_citations",
    source_a: "google_scholar",
    value_a: "1842",
    source_b: "researchgate",
    value_b: "1710",
    resolution: "unresolved",
    resolved_by: null,
    resolved_at: null,
    detected_at: "2026-08-15T11:00:00Z"
  },
  {
    id: "conf-5",
    faculty_id: "faculty-003",
    field_name: "department",
    source_a: "institutional",
    value_a: "Civil Engineering",
    source_b: "researchgate",
    value_b: "Civil and Environmental Engineering",
    resolution: "source_a",
    resolved_by: "admin",
    resolved_at: "2026-08-18T14:00:00Z",
    detected_at: "2026-08-18T13:00:00Z"
  }
];
