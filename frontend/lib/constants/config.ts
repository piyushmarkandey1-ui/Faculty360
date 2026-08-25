/**
 * Application-wide configuration constants.
 */

export const APP_NAME = 'AcadLens'
export const APP_DESCRIPTION =
  'AI-Enabled Academic Profile Analytics for Evidence-Based Faculty Assessment'
export const APP_TAGLINE = 'See the complete academic picture.'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'https://faculty360.vercel.app/api')


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
