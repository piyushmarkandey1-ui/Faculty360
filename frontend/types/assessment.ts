/**
 * Assessment domain types.
 * Mirrors the database schema defined in docs/DATABASE.md.
 * NOTE: AI insights are explicitly typed as advisory — they cannot produce scores.
 */

import type { AssessmentStatus, KPICategory } from '@/lib/constants/config'

export interface KPIScore {
  id: string
  assessment_id: string
  rule_id: string
  rule_name: string
  category: KPICategory
  raw_value: number
  computed_score: number
  max_score: number
  evidence: EvidenceRef[] | null
  rule_version: string
}

/** Links a score to the specific source record and field that produced it */
export interface EvidenceRef {
  source_record_id: string
  source_type: string
  field_path: string       // e.g. "publications[3].citation_count"
  value: string
}

/**
 * AI-generated insight.
 * is_advisory is ALWAYS true — enforced at schema level.
 * This type should never be used to derive numeric values.
 */
export interface AIInsight {
  id: string
  assessment_id: string
  model: string
  insight_text: string
  generated_at: string
  is_advisory: true        // Literal true — never false
}

export interface Assessment {
  id: string
  faculty_id: string
  assessed_at: string
  assessed_by: string | null
  total_score: number
  completeness_score: number
  confidence_score: number
  status: AssessmentStatus
  kpi_scores: KPIScore[]
  ai_insights: AIInsight | null
}

export interface AssessmentSummary {
  id: string
  faculty_id: string
  assessed_at: string
  total_score: number
  completeness_score: number
  confidence_score: number
  status: AssessmentStatus
}

/** Grouped KPI scores by category for display */
export interface KPICategory_Group {
  category: KPICategory
  category_label: string
  scores: KPIScore[]
  category_total: number
  category_max: number
}
