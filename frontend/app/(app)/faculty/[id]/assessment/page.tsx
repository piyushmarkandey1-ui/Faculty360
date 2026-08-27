'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Sparkles, FileSearch, Loader2 } from 'lucide-react'
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ParameterBar } from '@/components/ui/ParameterBar'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { HistoricalTrends } from '@/components/ui/HistoricalTrends'
import { ROUTES } from '@/lib/constants/routes'
import { formatRelativeTime } from '@/lib/utils/format'
import { apiFetch } from '@/lib/api/client'

export default function FacultyAssessmentPage() {
  const routeParams = useParams()
  const facultyId = (routeParams?.id as string) || ''

  const [isClient, setIsClient] = useState(false)
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const loadAssessment = async () => {
    if (!facultyId) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await apiFetch('/faculty/' + facultyId + '/assessment')
      setAssessment(res)
    } catch (err: any) {
      if (err.status !== 404) {
        setErrorMsg('Failed to load assessment')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
    if (facultyId) {
      loadAssessment()
    }
  }, [facultyId])

  const handleRunAssessment = async () => {
    if (!facultyId) return
    setCalculating(true)
    setErrorMsg(null)
    try {
      const res = await apiFetch('/faculty/' + facultyId + '/assessment/calculate', { method: 'POST' })
      // The API returns the calculated assessment summary, but we need the full assessment to render the UI
      // so we just reload it.
      await loadAssessment()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to run assessment')
    } finally {
      setCalculating(false)
    }
  }

  // Format data for radar chart
  const radarData = assessment?.kpi_scores?.map((kpi: any) => ({
    subject: kpi.category,
    A: kpi.computed_score,
    fullMark: kpi.max_score,
  })) || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <div>
        <Link href={ROUTES.faculty.profile(facultyId)} className="inline-flex items-center text-sm font-medium hover:underline mb-4" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} className="mr-1" /> Back to Profile
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[var(--danger-muted)] text-[var(--danger)] rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* Header Card */}
      <div className="p-6 rounded-xl border flex flex-col md:flex-row gap-8 items-start md:items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="text-xs uppercase tracking-wider mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>Latest Assessment</div>
          {loading ? (
            <div className="animate-pulse h-10 w-32 bg-[var(--bg-elevated)] rounded mb-3"></div>
          ) : assessment ? (
            <>
              <h1 className="text-3xl font-bold flex items-baseline gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                {assessment.total_score}
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>/ 100</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <ConfidenceBadge confidence={assessment.confidence_score} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completeness: {assessment.completeness_score}%</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>•</span>
                <Badge variant="success">Approved</Badge>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>•</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(assessment.created_at)}</span>
              </div>

            </>
          ) : (
             <div className="text-[var(--text-muted)] text-sm mb-3">No assessment has been run yet.</div>
          )}
        </div>
        
        <div>
          <Button variant="primary" onClick={handleRunAssessment} disabled={calculating} className="gap-2">
            {calculating && <Loader2 size={16} className="animate-spin" />}
            {calculating ? 'Calculating...' : 'Run New Assessment'}
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      {assessment && !assessment.ai_insights && (
        <div className="flex justify-end">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={async () => {
              try {
                // @ts-ignore (we'll import this above)
                const { apiFetch } = await import('@/lib/api/client');
                const insights = await apiFetch('/faculty/' + facultyId + '/insights', { method: 'POST' });
                setAssessment({ ...assessment, ai_insights: insights });
              } catch (e) {
                console.error(e);
                setErrorMsg('AI Service currently unavailable.');
              }
            }}
            className="gap-2"
          >
            <Sparkles size={14} style={{ color: 'var(--warning)' }} />
            Generate AI Insights
          </Button>
        </div>
      )}

      {assessment?.ai_insights && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border flex flex-col gap-4" 
          style={{ background: 'rgba(217, 146, 58, 0.05)', borderColor: 'rgba(217, 146, 58, 0.2)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="shrink-0" style={{ color: 'var(--warning)' }} size={20} />
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--warning)' }}>
              AI Interpretation
              <Badge variant="warning" className="text-[10px] uppercase">Advisory Only</Badge>
            </h3>
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
            {assessment.ai_insights.summary}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Key Insights</h4>
              <ul className="text-sm space-y-2 list-disc pl-4 text-[var(--text-primary)]">
                {assessment.ai_insights.keyInsights.map((ki: string, i: number) => <li key={i}>{ki}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-secondary)]">Recommended Actions</h4>
              <ul className="text-sm space-y-2 list-disc pl-4 text-[var(--text-primary)]">
                {assessment.ai_insights.recommendedActions.map((ra: string, i: number) => <li key={i}>{ra}</li>)}
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
             <div>
               <span className="text-xs font-semibold uppercase block mb-1 text-[var(--success)]">Strengths</span>
               <p className="text-xs text-[var(--text-secondary)]">{assessment.ai_insights.strengthNarrative}</p>
             </div>
             <div>
               <span className="text-xs font-semibold uppercase block mb-1 text-[var(--warning)]">Improvements</span>
               <p className="text-xs text-[var(--text-secondary)]">{assessment.ai_insights.improvementNarrative}</p>
             </div>
             <div>
               <span className="text-xs font-semibold uppercase block mb-1 text-[var(--accent)]">Trend</span>
               <p className="text-xs text-[var(--text-secondary)]">{assessment.ai_insights.trendNarrative}</p>
             </div>
          </div>
          
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Scores are strictly computed by rules. AI is used only for interpretive summaries and cannot modify verified evaluation results.
          </p>
        </motion.div>
      )}

      {/* Analytics Insights */}
      {assessment?.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 rounded-xl border flex flex-col gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Why this score?</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-[var(--success)]">Contributing Factors</h4>
                <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
                  {assessment.analytics.whyThisScore.contributingFactors.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                  {assessment.analytics.whyThisScore.contributingFactors.length === 0 && <li>None identified.</li>}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-[var(--warning)]">Limitations</h4>
                <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
                  {assessment.analytics.whyThisScore.limitations.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                  {assessment.analytics.whyThisScore.limitations.length === 0 && <li>None identified.</li>}
                </ul>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1">Performance Trend</span>
                <Badge variant={assessment.analytics.trends.direction === 'IMPROVING' ? 'success' : assessment.analytics.trends.direction === 'DECLINING' ? 'danger' : 'neutral'}>
                  {assessment.analytics.trends.direction}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1">Data Completeness</span>
                <span className="text-sm font-medium">{assessment.analytics.dataQuality.evidenceCompleteness.toFixed(0)}% Verified</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border flex flex-col gap-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Improvement Areas</h3>
            <div className="space-y-4">
              {assessment.analytics.improvementAreas.slice(0, 3).map((area: any, i: number) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-[var(--text-primary)]">{area.parameter}</span>
                    <Badge variant={area.missingEvidence ? "danger" : "warning"} className="text-[10px]">
                      {area.missingEvidence ? 'NO DATA' : 'LOW SCORE'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{area.reason}</p>
                  <p className="text-[10px] mt-1 text-[var(--text-muted)]">+ {area.potentialImpact} potential impact</p>
                </div>
              ))}
              {assessment.analytics.improvementAreas.length === 0 && (
                <div className="text-sm text-[var(--text-muted)]">No major improvement areas identified.</div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Historical Trends */}
        <HistoricalTrends facultyId={facultyId} />

      {/* Breakdown Section */}
      {assessment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="p-6 rounded-xl border flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <h3 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Category Distribution</h3>
            <div className="flex-1 min-h-[300px]">
              {isClient && radarData.length > 0 && (
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
              {assessment.kpi_scores?.map((kpi: any) => (
                <div key={kpi.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{kpi.rule_name}</span>
                      {kpi.status === 'INSUFFICIENT_EVIDENCE' && (
                        <Badge variant="danger" className="text-[10px]">MISSING EVIDENCE</Badge>
                      )}
                    </div>
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
      )}
    </div>
  )
}
