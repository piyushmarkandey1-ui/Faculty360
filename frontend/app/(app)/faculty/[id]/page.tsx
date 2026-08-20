'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Badge } from '@/components/ui/Badge'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ROUTES } from '@/lib/constants/routes'
import { MOCK_FACULTY_PROFILES, MOCK_PUBLICATIONS, MOCK_CONFLICTS } from '@/mock-data'
import { formatRelativeTime } from '@/lib/utils/format'

export default function FacultyProfilePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'sources' | 'conflicts'>('overview')
  const [conflicts, setConflicts] = useState(MOCK_CONFLICTS)
  
  // Default to fac-1 if not found
  const profile = MOCK_FACULTY_PROFILES[params.id] || MOCK_FACULTY_PROFILES['faculty-001']
  const { entity, unified_profile, publications_count, latest_assessment } = profile

  const resolveConflict = (id: string, _resolution: string) => {
    setConflicts(prev => prev.map(c => c.id === id ? { ...c, resolution: 'source_a' as const } : c))
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'research', label: `Research (${publications_count})` },
    { id: 'sources', label: 'Sources' },
    { id: 'conflicts', label: `Conflicts (${conflicts.filter(c => c.resolution === 'unresolved').length})` }
  ] as const

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="p-6 rounded-xl border flex flex-col md:flex-row gap-8 items-start md:items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{unified_profile.display_name}</h1>
            <ConfidenceBadge confidence={latest_assessment?.confidence_score ?? 0} />
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {entity.designation} • {entity.department} • {entity.institution}
          </p>
          <div className="flex flex-wrap gap-2">
            {unified_profile.source_coverage.google_scholar && <SourceBadge source="google_scholar" status="active" />}
            {unified_profile.source_coverage.researchgate && <SourceBadge source="researchgate" status="active" />}
            {unified_profile.source_coverage.institutional && <SourceBadge source="institutional" status="active" />}
            {unified_profile.source_coverage.orcid && <SourceBadge source="orcid" status="active" />}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <ScoreRing score={unified_profile.completeness_score} size="md" />
            <span className="text-xs mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Completeness</span>
          </div>
          
          <div className="h-16 w-px" style={{ background: 'var(--border-subtle)' }} />
          
          <div className="flex flex-col gap-2">
            <Link href={ROUTES.faculty.assessment(entity.id)}>
              <Button variant="primary" className="w-full justify-center">Run Assessment</Button>
            </Link>
            <Button variant="secondary" className="w-full justify-center gap-2">
              <RefreshCw size={14} /> Sync Data
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="pb-3 text-sm font-medium transition-colors relative"
              style={{ color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Publications', value: publications_count },
                { label: 'Citations', value: 1245 },
                { label: 'h-index', value: 18 },
                { label: 'Projects', value: 4 },
                { label: 'Students', value: 12 },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border flex flex-col items-center justify-center text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    <AnimatedCounter value={stat.value} duration={1} />
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Biography</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{unified_profile.bio}</p>
              
              <h3 className="font-semibold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Research Interests</h3>
              <div className="flex flex-wrap gap-2">
                {unified_profile.research_interests.map((interest, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-medium border" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'research' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {MOCK_PUBLICATIONS.slice(0, 6).map((pub) => (
              <div key={pub.id} className="p-5 rounded-xl border hover:border-[var(--border-default)] transition-colors flex gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }} title={pub.title}>{pub.title}</h4>
                   <div className="text-xs mb-2 truncate" style={{ color: 'var(--text-secondary)' }}>
                    {pub.venue} · {pub.year}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{pub.venue || 'Unknown Venue'}</span>
                    <span>•</span>
                    <span>{pub.year}</span>
                    {pub.citation_count !== null && (
                      <>
                        <span>•</span>
                        <span>{pub.citation_count} Citations</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <SourceBadge source={pub.source_type} status="active" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'sources' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'google_scholar', name: 'Google Scholar', status: 'Healthy', records: 82, lastSync: '2 hours ago' },
              { id: 'researchgate', name: 'ResearchGate', status: 'Missing', records: 0, lastSync: 'Never' },
              { id: 'institutional', name: 'Institutional DB', status: 'Healthy', records: 87, lastSync: '1 day ago' },
              { id: 'orcid', name: 'ORCID', status: 'Healthy', records: 45, lastSync: '5 days ago' },
            ].map(src => (
              <div key={src.id} className="p-5 rounded-xl border flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SourceBadge source={src.id as any} status="active" />
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{src.name}</span>
                  </div>
                  <Badge variant={src.status === 'Healthy' ? 'success' : 'neutral'}>{src.status}</Badge>
                </div>
                <div className="flex justify-between items-end mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Records Found</div>
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{src.records}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Last Synced</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{src.lastSync}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'conflicts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-[var(--text-secondary)]">Resolve data discrepancies between sources.</p>
              <Link href={ROUTES.faculty.review(entity.id)}>
                <Button variant="secondary" size="sm">Open Review Hub</Button>
              </Link>
            </div>
            
            {conflicts.map(conflict => {
              const isResolved = conflict.resolution !== 'unresolved'
              return (
                <div key={conflict.id} className="p-5 rounded-xl border transition-colors" style={{ 
                  background: isResolved ? 'var(--bg-base)' : 'var(--bg-surface)', 
                  borderColor: isResolved ? 'var(--border-subtle)' : 'var(--warning)',
                  opacity: isResolved ? 0.7 : 1
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      {isResolved ? <CheckCircle2 className="text-[var(--success)]" size={16} /> : <AlertTriangle className="text-[var(--warning)]" size={16} />}
                      {conflict.field_name.replace('_', ' ').toUpperCase()}
                    </h4>
                    {isResolved && <Badge variant="success">Resolved</Badge>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                      <div className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <SourceBadge source={conflict.source_a} status="active" /> {conflict.source_a}
                      </div>
                      <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{String(conflict.value_a)}</div>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                      <div className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <SourceBadge source={conflict.source_b} status="active" /> {conflict.source_b}
                      </div>
                      <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{String(conflict.value_b)}</div>
                    </div>
                  </div>
                  
                  {!isResolved && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => resolveConflict(conflict.id, 'A')}>Use Source A</Button>
                      <Button variant="secondary" size="sm" onClick={() => resolveConflict(conflict.id, 'B')}>Use Source B</Button>
                    </div>
                  )}
                </div>
              )
            })}
            {conflicts.length === 0 && (
              <div className="py-12 text-center text-[var(--text-muted)]">
                No conflicts found for this profile.
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
