'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ArrowLeft, Sparkles, FileSearch, Loader2, Home, CheckCircle2 } from 'lucide-react'
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

// ── Animated Assessment Overlay ──────────────────────────────────────────────
const DATA_SOURCES = [
  { id: 'gs',  label: 'Google Scholar',   icon: '📚', color: '#4285F4', angle: 210 },
  { id: 'oc',  label: 'ORCID',            icon: '🔬', color: '#A6CE39', angle: 150 },
  { id: 'rg',  label: 'ResearchGate',     icon: '📖', color: '#00CCBB', angle: 90  },
  { id: 'db',  label: 'Institutional DB', icon: '🏛️', color: '#FF8C00', angle: 330 },
  { id: 'ai',  label: 'AI Framework',     icon: '🤖', color: '#9B59B6', angle: 270 },
]

function AssessmentAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'gathering' | 'merging' | 'scoring' | 'done'>('gathering')
  const [activeSource, setActiveSource] = useState<string | null>(null)
  const [completedSources, setCompletedSources] = useState<string[]>([])
  const [scoreValue, setScoreValue] = useState(0)
  const targetScore = 88

  useEffect(() => {
    let delay = 400
    DATA_SOURCES.forEach((src) => {
      setTimeout(() => setActiveSource(src.id), delay)
      delay += 500
      setTimeout(() => setCompletedSources(prev => [...prev, src.id]), delay)
      delay += 200
    })
    setTimeout(() => { setPhase('merging'); setActiveSource(null) }, delay + 200)
    setTimeout(() => setPhase('scoring'), delay + 900)
    setTimeout(() => setPhase('done'), delay + 2200)
    setTimeout(() => onComplete(), delay + 2700)
  }, [])

  useEffect(() => {
    if (phase !== 'scoring') return
    let start = 0
    const step = targetScore / 40
    const interval = setInterval(() => {
      start += step
      if (start >= targetScore) { setScoreValue(targetScore); clearInterval(interval) }
      else setScoreValue(Math.round(start))
    }, 25)
    return () => clearInterval(interval)
  }, [phase])

  const radius = 120
  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative" style={{ width: radius * 2 + 120, height: radius * 2 + 120 }}>
        {/* Center core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="rounded-full flex flex-col items-center justify-center text-center"
            style={{ width: 120, height: 120, background: 'var(--bg-elevated)', border: '2px solid var(--border-default)' }}
            animate={phase === 'merging' ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.8, repeat: phase === 'merging' ? Infinity : 0 }}
          >
            {phase === 'scoring' || phase === 'done' ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{scoreValue}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 100</div>
              </motion.div>
            ) : (
              <>
                <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>AcadLens</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{phase === 'gathering' ? 'Fetching…' : 'Merging…'}</div>
              </>
            )}
          </motion.div>
        </div>
        {/* Source cards in orbit */}
        {DATA_SOURCES.map((src) => {
          const rad = (src.angle * Math.PI) / 180
          const cx = radius * Math.cos(rad) + radius + 60
          const cy = radius * Math.sin(rad) + radius + 60
          const isActive = activeSource === src.id
          const isDone = completedSources.includes(src.id)
          return (
            <motion.div key={src.id} className="absolute flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ left: cx - 60, top: cy - 20, background: isDone ? `${src.color}20` : 'var(--bg-elevated)', border: `1px solid ${isDone ? src.color : 'var(--border-subtle)'}`, color: isDone ? src.color : 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: 120 }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: isActive ? 1.1 : 1, boxShadow: isActive ? `0 0 20px ${src.color}55` : 'none' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <span>{src.icon}</span>
              <span style={{ fontSize: 11 }}>{src.label}</span>
              {isDone && <CheckCircle2 size={12} style={{ color: src.color }} />}
            </motion.div>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {phase === 'gathering' && '⚡ Fetching live academic data from all sources…'}
          {phase === 'merging' && '🔀 Merging & resolving conflicts…'}
          {phase === 'scoring' && '📊 Calculating deterministic KPI score…'}
          {phase === 'done' && '✅ Assessment complete!'}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function FacultyAssessmentPage() {
  const routeParams = useParams()
  const pathname = usePathname()

  let facultyId = (routeParams?.id as string) || ''
  if (!facultyId || facultyId === 'undefined') {
    const match = pathname?.match(/\/faculty\/([a-zA-Z0-9_-]+)/)
    if (match && match[1] && match[1] !== 'new') {
      facultyId = match[1]
    }
  }

  const [isClient, setIsClient] = useState(false)
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const loadAssessment = async () => {
    if (!facultyId || facultyId === 'undefined') {
      setLoading(false)
      return
    }
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

  const [showAnimation, setShowAnimation] = useState(false)

  const handleRunAssessment = async () => {
    if (!facultyId) return
    setShowAnimation(true)   // play animation immediately
    setErrorMsg(null)
    try {
      await apiFetch('/faculty/' + facultyId + '/assessment/calculate', { method: 'POST' })
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to run assessment')
    }
    // animation will call handleAnimationComplete when done
  }

  const handleAnimationComplete = async () => {
    setShowAnimation(false)
    await loadAssessment()
  }

  // Format data for radar chart (only categories with connected data sources)
  const radarData = assessment?.kpi_scores
    ?.filter((kpi: any) => kpi.status !== 'SOURCE_UNAVAILABLE')
    ?.map((kpi: any) => ({
      subject: kpi.category,
      A: kpi.computed_score,
      fullMark: kpi.max_score,
    })) || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Fluid animated assessment overlay */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(11,14,20,0.92)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <AssessmentAnimation onComplete={handleAnimationComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home + Back navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
          <Home size={13} /> Home
        </Link>
        <span style={{ color: 'var(--border-default)' }}>/</span>
        <Link href={ROUTES.faculty.profile(facultyId)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
          <ArrowLeft size={13} /> Back to Profile
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[var(--danger-muted)] text-[var(--danger)] rounded-lg text-sm">{errorMsg}</div>
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
          <Button variant="primary" onClick={handleRunAssessment} disabled={showAnimation} className="gap-2">
            {showAnimation && <Loader2 size={16} className="animate-spin" />}
            {showAnimation ? 'Calculating...' : 'Run New Assessment'}
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
                      {kpi.status === 'SOURCE_UNAVAILABLE' ? (
                        <Badge variant="neutral" className="text-[10px]">SOURCE NOT CONNECTED</Badge>
                      ) : kpi.status === 'INSUFFICIENT_EVIDENCE' ? (
                        <Badge variant="danger" className="text-[10px]">MISSING EVIDENCE</Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">VERIFIED</Badge>
                      )}
                    </div>
                    {kpi.status !== 'SOURCE_UNAVAILABLE' && (
                      <Link 
                        href={ROUTES.assessment.evidence(assessment.id)} 
                        className="text-xs flex items-center gap-1 hover:underline" 
                        style={{ color: 'var(--accent)' }}
                      >
                        <FileSearch size={12} /> View Evidence
                      </Link>
                    )}
                  </div>
                  <ParameterBar 
                    label={kpi.category} 
                    score={kpi.status === 'SOURCE_UNAVAILABLE' ? 0 : kpi.computed_score} 
                    maxScore={kpi.max_score} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
