'use client'
import { useState, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronRight, Activity, Database, ListChecks, FileText, FileSearch } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROUTES } from '@/lib/constants/routes'

export default function EvidencePage({ params }: { params: { id: string } }) {
  useEffect(() => {
    import('@/lib/api/client').then(({ apiFetch }) => {
      // Assuming params.id is the faculty ID here as they correspond 1-1 right now in our UI routes
      apiFetch(`/faculty/${params.id}/assessment`).then((data: any) => {
        if(data) setAssessment(data)
      }).catch(console.error)
    })
  }, [params.id])
  const [assessment, setAssessment] = useState<any>(null)

  // Manage expansion state of levels (1 to 5)
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
  })

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => ({ ...prev, [level]: !prev[level] }))
  }

  // Assessment not found ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â show empty state instead of displaying wrong data
  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <EmptyState
          icon={FileSearch}
          title="Assessment Not Found"
          description={`No assessment record exists for ID "${params.id}". It may have been deleted or the link is incorrect.`}
          action={{ label: 'Back to Assessments', onClick: () => window.history.back() }}
        />
      </div>
    )
  }

  // Example subset of rules for visual
  const pubKpi = assessment.kpi_scores.find((k: any) => k.category === 'research_output') ?? assessment.kpi_scores[0]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link href={ROUTES.faculty.assessment(assessment.faculty_id)} className="inline-flex items-center text-sm font-medium hover:underline mb-4" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} className="mr-1" /> Back to Assessment
        </Link>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Evidence Trail</h1>
        
        {/* Breadcrumb text */}
        <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span>Faculty</span>
          <ChevronRight size={14} />
          <span>Assessment #{params.id}</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-primary)' }}>Evidence</span>
        </div>
      </div>

      {/* Visual Chain */}
      <div className="py-8">
        <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Computation Chain</h2>
        
        <div className="relative pl-4 space-y-4">
          {/* Vertical line connecting nodes */}
          <div className="absolute left-[31px] top-4 bottom-8 w-px bg-[var(--border-default)]" />

          {/* Level 1 */}
          <div className="relative z-10 flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
              <Activity size={16} />
            </div>
            <div className="flex-1 p-4 rounded-xl border cursor-pointer hover:border-[var(--accent)] transition-colors" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }} onClick={() => toggleLevel(1)}>
              <div className="flex justify-between items-center">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Level 1: Overall Score</h3>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{assessment.total_score}</span>
                  {expandedLevels[1] ? <ChevronDown size={18} className="text-[var(--text-muted)]" /> : <ChevronRight size={18} className="text-[var(--text-muted)]" />}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expandedLevels[1] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative z-10 flex gap-4 ml-8">
                <div className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                  <ListChecks size={14} className="text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 p-4 rounded-xl border cursor-pointer hover:border-[var(--accent)] transition-colors" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }} onClick={() => toggleLevel(2)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Level 2: Category Score (Publications)</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Aggregated from KPI rules</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pubKpi.computed_score} / {pubKpi.max_score}</span>
                      {expandedLevels[2] ? <ChevronDown size={18} className="text-[var(--text-muted)]" /> : <ChevronRight size={18} className="text-[var(--text-muted)]" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {expandedLevels[1] && expandedLevels[2] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative z-10 flex gap-4 ml-16">
                <div className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 p-4 rounded-xl border cursor-pointer hover:border-[var(--accent)] transition-colors" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }} onClick={() => toggleLevel(3)}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Level 3: Rule Evaluation</h3>
                    {expandedLevels[3] ? <ChevronDown size={18} className="text-[var(--text-muted)]" /> : <ChevronRight size={18} className="text-[var(--text-muted)]" />}
                  </div>
                  <div className="text-sm space-y-1">
                    <p style={{ color: 'var(--text-secondary)' }}>Rule ID: <span style={{ color: 'var(--text-primary)' }}>{pubKpi.rule_id}</span></p>
                    <p style={{ color: 'var(--text-secondary)' }}>Version: <span style={{ color: 'var(--text-primary)' }}>{pubKpi.rule_version}</span></p>
                    <p style={{ color: 'var(--text-secondary)' }}>Raw Input: <span style={{ color: 'var(--text-primary)' }}>{pubKpi.raw_value}</span></p>
                  </div>
                </div>
              </motion.div>
            )}

            {expandedLevels[1] && expandedLevels[2] && expandedLevels[3] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative z-10 flex gap-4 ml-24">
                <div className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                  <Database size={14} className="text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 p-4 rounded-xl border cursor-pointer hover:border-[var(--accent)] transition-colors" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }} onClick={() => toggleLevel(4)}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Level 4: Entity Records</h3>
                    {expandedLevels[4] ? <ChevronDown size={18} className="text-[var(--text-muted)]" /> : <ChevronRight size={18} className="text-[var(--text-muted)]" />}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Computed from {pubKpi.raw_value} unified canonical publications.</p>
                </div>
              </motion.div>
            )}

            {expandedLevels[1] && expandedLevels[2] && expandedLevels[3] && expandedLevels[4] && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative z-10 flex gap-4 ml-32">
                <div className="w-8 h-8 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                  <Database size={14} className="text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                  <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Level 5: Raw Sources</h3>
                  <div className="space-y-2">
                    {((pubKpi?.evidence) ?? []).map((ev: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral">{ev.source_type}</Badge>
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ev.field_path}</span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Value: {ev.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Table */}
      <div className="rounded-xl border overflow-hidden mt-10" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="p-4 border-b bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Complete KPI Evidence Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Raw Value</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium text-right">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {assessment.kpi_scores.map((kpi: any) => (
                <tr key={kpi.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{kpi.rule_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{kpi.category}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-primary)]">{kpi.raw_value}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--accent)' }}>{kpi.computed_score}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-secondary)]">{kpi.max_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
