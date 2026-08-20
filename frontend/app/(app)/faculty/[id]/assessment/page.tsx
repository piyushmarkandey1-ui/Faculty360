'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Sparkles, FileSearch } from 'lucide-react'
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ParameterBar } from '@/components/ui/ParameterBar'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { ROUTES } from '@/lib/constants/routes'
import { MOCK_ASSESSMENTS, MOCK_FACULTY_PROFILES } from '@/mock-data'
import { formatRelativeTime } from '@/lib/utils/format'

export default function FacultyAssessmentPage({ params }: { params: { id: string } }) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const profile = MOCK_FACULTY_PROFILES[params.id] || MOCK_FACULTY_PROFILES['faculty-001']
  // Use latest assessment or fallback to assess-1
  const assessment = MOCK_ASSESSMENTS[profile.latest_assessment?.id ?? ''] ?? MOCK_ASSESSMENTS['assessment-001']

  // Format data for radar chart
  const radarData = assessment.kpi_scores.map(kpi => ({
    subject: kpi.category,
    A: kpi.computed_score,
    fullMark: kpi.max_score,
  }))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <div>
        <Link href={ROUTES.faculty.profile(profile.entity.id)} className="inline-flex items-center text-sm font-medium hover:underline mb-4" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} className="mr-1" /> Back to Profile
        </Link>
      </div>

      {/* Header Card */}
      <div className="p-6 rounded-xl border flex flex-col md:flex-row gap-8 items-start md:items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>Latest Assessment</div>
          <h1 className="text-3xl font-bold flex items-baseline gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
            {assessment.total_score}
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>/ 100</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <ConfidenceBadge confidence={assessment.confidence_score} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completeness: {assessment.completeness_score}%</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>•</span>
            <Badge variant="neutral">Draft</Badge>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>•</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(assessment.assessed_at)}</span>
          </div>
        </div>
        
        <div>
          <Button variant="primary">Run New Assessment</Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      {assessment.ai_insights && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border flex gap-4" 
          style={{ background: 'rgba(217, 146, 58, 0.05)', borderColor: 'rgba(217, 146, 58, 0.2)' }}
        >
          <Sparkles className="shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--warning)' }}>
              AI Interpretation
              <Badge variant="warning" className="text-[10px] uppercase">Advisory Only</Badge>
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {assessment.ai_insights.insight_text}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Scores are strictly computed by rules. AI is used only for interpretive summaries.
            </p>
          </div>
        </motion.div>
      )}

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="p-6 rounded-xl border flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <h3 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Category Distribution</h3>
          <div className="flex-1 min-h-[300px]">
            {isClient && (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="var(--border-default)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Radar name="Score" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Individual Scores */}
        <div className="p-6 rounded-xl border flex flex-col gap-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Parameter Breakdown</h3>
          
          <div className="space-y-5">
            {assessment.kpi_scores.map(kpi => (
              <div key={kpi.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{kpi.rule_name}</span>
                  <Link 
                    href={ROUTES.assessment.evidence(assessment.id)} 
                    className="text-xs flex items-center gap-1 hover:underline" 
                    style={{ color: 'var(--accent)' }}
                  >
                    <FileSearch size={12} /> View Evidence
                  </Link>
                </div>
                <ParameterBar label={kpi.category} score={kpi.computed_score} maxScore={kpi.max_score} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
