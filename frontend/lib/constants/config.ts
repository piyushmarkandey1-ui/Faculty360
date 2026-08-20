/**
 * Application-wide configuration constants.
 */

export const APP_NAME = 'A³P-Web'
export const APP_DESCRIPTION =
  'AI-Enabled Academic Profile Analytics Using Multi-Source Public Web and Institutional Data'
export const APP_TAGLINE = 'Rules Calculate. AI Interprets. Humans Decide.'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

/** Source types supported by the platform */
export const SOURCE_TYPES = ['google_scholar', 'researchgate', 'institutional', 'orcid'] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

/** Onboarding status values */
export const ONBOARDING_STATUSES = ['pending', 'active', 'archived'] as const
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number]

/** Assessment status values */
export const ASSESSMENT_STATUSES = ['draft', 'submitted', 'approved', 'rejected'] as const
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number]

/** Conflict resolution options */
export const CONFLICT_RESOLUTIONS = ['source_a', 'source_b', 'manual', 'unresolved'] as const
export type ConflictResolution = (typeof CONFLICT_RESOLUTIONS)[number]

/** KPI category IDs */
export const KPI_CATEGORIES = [
  'research_output',
  'publication_quality',
  'research_impact',
  'profile_completeness',
  'source_coverage',
] as const
export type KPICategory = (typeof KPI_CATEGORIES)[number]
