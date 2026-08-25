/**
 * Faculty domain types.
 * Mirrors the database schema defined in docs/DATABASE.md.
 */

import type { SourceType, OnboardingStatus } from '@/lib/constants/config'

export interface FacultyEntity {
  id: string
  canonical_name: string
  canonical_email: string | null
  department: string
  designation: string
  institution: string
  scholar_id: string | null
  researchgate_slug: string | null
  orcid_id: string | null
  onboarding_status: OnboardingStatus
  created_at: string
  updated_at: string
}

export interface SourceCoverage {
  google_scholar: boolean
  researchgate: boolean
  institutional: boolean
  orcid?: boolean
}

export interface UnifiedProfile {
  display_name: string
  bio: string | null
  research_interests: string[]
  completeness_score: number
  source_coverage: SourceCoverage
  conflict_count: number
  last_synced_at: string | null
  updated_at: string
}

export interface Publication {
  id: string
  faculty_id: string
  title: string
  year: number | null
  venue: string | null
  doi: string | null
  citation_count: number
  source_type: SourceType
  is_verified: boolean
  dedup_status: 'unique' | 'duplicate' | 'candidate'
  created_at: string
}

export interface ProfileConflict {
  id: string
  faculty_id: string
  field_name: string
  source_a: SourceType
  value_a: string
  source_b: SourceType
  value_b: string
  resolution: 'source_a' | 'source_b' | 'manual' | 'unresolved'
  status?: 'OPEN' | 'RESOLVED' | 'IGNORED'
  severity?: string
  resolved_by: string | null
  resolved_at: string | null
  detected_at: string
}

/** Summary object used in list views */
export interface FacultySummary {
  id: string
  canonical_name: string
  department: string
  designation: string
  onboarding_status: OnboardingStatus
  completeness_score: number
  conflict_count: number
  last_synced_at: string | null
  source_coverage: SourceCoverage
}

/** Full profile response from GET /faculty/{id} */
export interface FacultyProfileResponse {
  entity: FacultyEntity
  unified_profile: UnifiedProfile
  publications_count: number
  latest_assessment: AssessmentSummary | null
}

/** Imported here to avoid circular deps — defined fully in assessment.ts */
export interface AssessmentSummary {
  id: string
  total_score: number
  completeness_score: number
  confidence_score: number
  status: string
  assessed_at: string
}
