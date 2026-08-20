import type { DashboardSummary } from '@/lib/api/client';

export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  faculty_total: 156,
  faculty_active: 142,
  assessments_this_cycle: 89,
  avg_completeness: 84.5,
  pending_conflicts: 23,
  last_ingestion_at: "2026-08-20T10:00:00Z",
  source_health: {
    google_scholar: 'healthy',
    researchgate: 'healthy',
    institutional: 'healthy',
    orcid: 'degraded'
  }
};
