import type { Assessment } from '@/types/assessment';

export const MOCK_ASSESSMENTS: Record<string, Assessment> = {
  "assessment-001": {
    id: "assessment-001",
    faculty_id: "faculty-001",
    assessed_at: "2026-08-20T08:05:00Z",
    assessed_by: "admin",
    total_score: 84.7,
    completeness_score: 87,
    confidence_score: 91,
    status: "draft",
    kpi_scores: [
      {
        id: "kpi-1",
        assessment_id: "assessment-001",
        rule_id: "research_output.publication_count",
        rule_name: "Total Publication Count",
        category: "research_output",
        raw_value: 87,
        computed_score: 68.0,
        max_score: 100,
        evidence: [
          {
            source_record_id: "sr-gs-001",
            source_type: "google_scholar",
            field_path: "publications.length",
            value: "82"
          },
          {
            source_record_id: "sr-inst-001",
            source_type: "institutional",
            field_path: "publication_records.count",
            value: "87"
          }
        ],
        rule_version: "1.0.0"
      },
      {
        id: "kpi-2",
        assessment_id: "assessment-001",
        rule_id: "publication_quality.venue_tier",
        rule_name: "Publication Venue Quality",
        category: "publication_quality",
        raw_value: 22,
        computed_score: 62.0,
        max_score: 80,
        evidence: [
          {
            source_record_id: "sr-gs-001",
            source_type: "google_scholar",
            field_path: "publications[*].venue",
            value: "Mixed: ACM, IEEE, Springer"
          }
        ],
        rule_version: "1.0.0"
      },
      {
        id: "kpi-3",
        assessment_id: "assessment-001",
        rule_id: "research_impact.h_index",
        rule_name: "H-Index Score",
        category: "research_impact",
        raw_value: 21,
        computed_score: 49.0,
        max_score: 60,
        evidence: [
          {
            source_record_id: "sr-gs-001",
            source_type: "google_scholar",
            field_path: "h_index",
            value: "21"
          }
        ],
        rule_version: "1.0.0"
      },
      {
        id: "kpi-4",
        assessment_id: "assessment-001",
        rule_id: "profile_completeness.field_coverage",
        rule_name: "Unified Profile Field Coverage",
        category: "profile_completeness",
        raw_value: 87,
        computed_score: 26.1,
        max_score: 30,
        evidence: null,
        rule_version: "1.0.0"
      },
      {
        id: "kpi-5",
        assessment_id: "assessment-001",
        rule_id: "source_coverage.active_sources",
        rule_name: "Active Source Coverage",
        category: "source_coverage",
        raw_value: 3,
        computed_score: 30.0,
        max_score: 30,
        evidence: null,
        rule_version: "1.0.0"
      }
    ],
    ai_insights: {
      id: "insight-001",
      assessment_id: "assessment-001",
      model: "gemini-1.5-pro",
      insight_text: "Dr. Rajesh Kumar Sharma demonstrates a strong and consistent research trajectory. Publication output increased 50% over the observed period, with citation velocity improving particularly in applied machine learning. The h-index of 21 places this faculty in the top quartile for the department. Teaching performance remains consistently strong. Outreach contribution is comparatively lower and may warrant attention in the next evaluation cycle.",
      generated_at: "2026-08-20T08:06:00Z",
      is_advisory: true
    }
  },
  "assessment-002": {
    id: "assessment-002",
    faculty_id: "faculty-002",
    assessed_at: "2026-08-19T14:35:00Z",
    assessed_by: "admin",
    total_score: 75.0,
    completeness_score: 82,
    confidence_score: 78,
    status: "draft",
    kpi_scores: [
      {
        id: "kpi-201",
        assessment_id: "assessment-002",
        rule_id: "research_output.publication_count",
        rule_name: "Total Publication Count",
        category: "research_output",
        raw_value: 34,
        computed_score: 48.0,
        max_score: 100,
        evidence: [
          {
            source_record_id: "sr-gs-002",
            source_type: "google_scholar",
            field_path: "publications.length",
            value: "34"
          }
        ],
        rule_version: "1.0.0"
      },
      {
        id: "kpi-202",
        assessment_id: "assessment-002",
        rule_id: "publication_quality.venue_tier",
        rule_name: "Publication Venue Quality",
        category: "publication_quality",
        raw_value: 14,
        computed_score: 52.0,
        max_score: 80,
        evidence: null,
        rule_version: "1.0.0"
      },
      {
        id: "kpi-203",
        assessment_id: "assessment-002",
        rule_id: "research_impact.h_index",
        rule_name: "H-Index Score",
        category: "research_impact",
        raw_value: 12,
        computed_score: 34.0,
        max_score: 60,
        evidence: [
          {
            source_record_id: "sr-gs-002",
            source_type: "google_scholar",
            field_path: "h_index",
            value: "12"
          }
        ],
        rule_version: "1.0.0"
      },
      {
        id: "kpi-204",
        assessment_id: "assessment-002",
        rule_id: "profile_completeness.field_coverage",
        rule_name: "Unified Profile Field Coverage",
        category: "profile_completeness",
        raw_value: 82,
        computed_score: 24.6,
        max_score: 30,
        evidence: null,
        rule_version: "1.0.0"
      },
      {
        id: "kpi-205",
        assessment_id: "assessment-002",
        rule_id: "source_coverage.active_sources",
        rule_name: "Active Source Coverage",
        category: "source_coverage",
        raw_value: 2,
        computed_score: 20.0,
        max_score: 30,
        evidence: null,
        rule_version: "1.0.0"
      }
    ],
    ai_insights: {
      id: "insight-002",
      assessment_id: "assessment-002",
      model: "gemini-1.5-pro",
      insight_text: "Dr. Anjali Sharma shows solid research output in VLSI Design and Embedded Systems. The h-index of 12 is respectable for her career stage. ResearchGate profile is absent, which reduces source coverage confidence. Connecting ResearchGate would likely raise the completeness score by 8–12 points.",
      generated_at: "2026-08-19T14:36:00Z",
      is_advisory: true
    }
  }
};
