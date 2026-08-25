'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, Loader2, Link as LinkIcon, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Badge } from '@/components/ui/Badge'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ROUTES } from '@/lib/constants/routes'
import { MOCK_FACULTY_PROFILES, MOCK_PUBLICATIONS, MOCK_CONFLICTS } from '@/mock-data'
import { formatRelativeTime } from '@/lib/utils/format'
import { syncSource, getFacultyConflicts, type SyncScholarResult } from '@/lib/api/client'
import type { ProfileConflict } from '@/types/faculty'

export type SyncStateStatus = 'idle' | 'input' | 'syncing' | 'success' | 'error' | 'unavailable'
export interface SourceState {
  status: SyncStateStatus
  url: string
  result: SyncScholarResult | null
  error: string | null
}

export default function FacultyProfilePage({ params }: { params: { id: string } }) {
  useEffect(() => {
    import('@/lib/api/client').then(({ apiFetch }) => {
      apiFetch(`/faculty/${params.id}`).then((data: any) => {
        if(data && data.canonical_name) {
          setProfile((prev: any) => ({
             ...prev, 
             entity: data,
             unified_profile: data
          }))
        }
      }).catch(console.error)
      
      apiFetch(`/faculty/${params.id}/publications`).then((data: any) => {
        if(data && data.items && data.items.length > 0) {
          setPublications(data.items)
        }
      }).catch(console.error)
    })
  }, [params.id])
  const [publications, setPublications] = useState<any[]>(MOCK_PUBLICATIONS)
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'sources' | 'conflicts'>('overview')
  const [conflicts, setConflicts] = useState<ProfileConflict[]>(MOCK_CONFLICTS)
  const [loadingConflicts, setLoadingConflicts] = useState(false)
  
  // Multi-source Sync State
  const [sourceStates, setSourceStates] = useState<Record<string, SourceState>>({
    google_scholar: { status: 'idle', url: '', result: null, error: null },
    orcid: { status: 'idle', url: '', result: null, error: null },
    researchgate: { status: 'idle', url: '', result: null, error: null }
  })

  useEffect(() => {
    async function loadConflicts() {
      try {
        setLoadingConflicts(true)
        const res = await getFacultyConflicts(params.id)
        if (res.items && res.items.length > 0) {
          setConflicts(res.items)
        }
      } catch (err) {
        console.error('Failed to load conflicts', err)
      } finally {
        setLoadingConflicts(false)
      }
    }
    loadConflicts()
  }, [params.id])

  const updateSourceState = (sourceId: string, updates: Partial<SourceState>) => {
    setSourceStates(prev => ({
      ...prev,
      [sourceId]: { ...prev[sourceId], ...updates }
    }))
  }

  const handleSourceSync = async (sourceId: string) => {
    const state = sourceStates[sourceId]
    if (!state.url.trim()) {
      updateSourceState(sourceId, { error: 'Please enter a valid URL or identifier', status: 'error' })
      return
    }
    
    updateSourceState(sourceId, { status: 'syncing', error: null })
    try {
      const res = await syncSource(params.id, sourceId, state.url)
      if (res.status === 'unavailable') {
        updateSourceState(sourceId, { status: 'unavailable', error: res.message || 'Source is currently unavailable' })
      } else {
        updateSourceState(sourceId, { result: res, status: 'success' })
        // Reload conflicts after sync
        const cRes = await getFacultyConflicts(params.id)
        if (cRes.items) setConflicts(cRes.items)
      }
    } catch (err: any) {
      updateSourceState(sourceId, { error: err.message || `Failed to sync ${sourceId}`, status: 'error' })
    }
  }

  // Default to fac-1 if not found
  const [profile, setProfile] = useState<any>(MOCK_FACULTY_PROFILES[params.id] || MOCK_FACULTY_PROFILES['faculty-001'])
  const { entity, unified_profile, publications_count, latest_assessment } = profile || {}

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
                {unified_profile.research_interests?.map((interest: string, i: number) => (
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
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Verified Publications</h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-deduplicated across 4 sources</span>
            </div>
            
            <div className="grid gap-3">
              {publications.map(pub => (
                <div key={pub.id} className="p-5 rounded-xl border hover:border-[var(--border-default)] transition-colors flex gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }} title={pub.title}>{pub.title}</h4>
                    <div className="text-xs mb-2 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {pub.venue} • {pub.year}
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
            </div>
          </motion.div>
        )}


        {activeTab === 'sources' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Syncable Sources */}
            {[
              { id: 'google_scholar', name: 'Google Scholar', defaultUrlText: 'https://scholar.google.com/citations?user=...' },
              { id: 'orcid', name: 'ORCID', defaultUrlText: 'https://orcid.org/XXXX-XXXX-XXXX-XXXX' },
              { id: 'researchgate', name: 'ResearchGate', defaultUrlText: 'https://www.researchgate.net/profile/...' }
            ].map(src => {
              const state = sourceStates[src.id]
              return (
                <div key={src.id} className="p-5 rounded-xl border flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <SourceBadge source={src.id as any} status="active" />
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{src.name}</span>
                    </div>
                    <Badge variant={state.status === 'success' ? 'success' : state.status === 'error' ? 'danger' : state.status === 'unavailable' ? 'warning' : 'neutral'}>
                      {state.status === 'success' ? 'Synced' : state.status === 'syncing' ? 'Syncing...' : state.status === 'unavailable' ? 'Pending Integration' : 'Connected'}
                    </Badge>
                  </div>

                  {state.status === 'input' || state.status === 'syncing' || state.status === 'error' ? (
                    <div className="flex flex-col gap-3 mt-auto border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Enter Profile URL or ID</div>
                      <input
                        type="url"
                        placeholder={src.defaultUrlText}
                        value={state.url}
                        onChange={(e) => updateSourceState(src.id, { url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-colors"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                        disabled={state.status === 'syncing'}
                      />
                      {state.error && <div className="text-xs" style={{ color: 'var(--danger)' }}>{state.error}</div>}
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleSourceSync(src.id)} disabled={state.status === 'syncing'} className="flex-1 justify-center gap-2">
                          {state.status === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          {state.status === 'syncing' ? 'Syncing...' : 'Start Sync'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => updateSourceState(src.id, { status: 'idle', error: null })} disabled={state.status === 'syncing'}>Cancel</Button>
                      </div>
                    </div>
                  ) : state.status === 'success' && state.result ? (
                    <div className="mt-auto border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-medium" style={{ color: 'var(--success)' }}>Sync Completed</div>
                        <Button variant="secondary" size="sm" onClick={() => updateSourceState(src.id, { status: 'idle' })}>Dismiss</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span style={{ color: 'var(--text-muted)' }}>Found:</span> {state.result.publicationsFound}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Added:</span> {state.result.publicationsAdded}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>h-index:</span> {state.result.hIndex}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Citations:</span> {state.result.citations}</div>
                      </div>
                    </div>
                  ) : state.status === 'unavailable' ? (
                     <div className="mt-auto border-t pt-4 flex flex-col gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                       <div className="p-3 rounded-lg flex gap-3 text-sm" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>
                         <Info size={16} className="shrink-0 mt-0.5" />
                         <p>{state.error || 'Integration pending authorized access.'}</p>
                       </div>
                       <Button variant="secondary" size="sm" onClick={() => updateSourceState(src.id, { status: 'idle', error: null })}>Dismiss</Button>
                     </div>
                  ) : (
                    <div className="flex justify-between items-end mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Records Found</div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{state.result ? state.result.publicationsFound : (src.id === 'google_scholar' ? 82 : src.id === 'orcid' ? 45 : 0)}</div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Last Synced</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{state.result ? 'Just now' : (src.id === 'google_scholar' ? '2 hours ago' : src.id === 'orcid' ? '5 days ago' : 'Never')}</div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => updateSourceState(src.id, { status: 'input' })} className="gap-2">
                          <RefreshCw size={12} /> Force Sync
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Static Institutional Data Card */}
            <div className="p-5 rounded-xl border flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SourceBadge source="institutional" status="active" />
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Institutional DB</span>
                </div>
                <Badge variant="success">Healthy</Badge>
              </div>
              <div className="flex justify-between items-end mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Records Found</div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>87</div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Last Synced</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>1 day ago</div>
                  </div>
                  <Button variant="secondary" size="sm" className="gap-2 opacity-50 cursor-not-allowed">
                    <RefreshCw size={12} /> Auto-Syncing
                  </Button>
                </div>
              </div>
            </div>
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
              const isResolved = conflict.status === 'RESOLVED' || conflict.resolution !== 'unresolved'
              const severityColor = conflict.severity === 'high' ? 'var(--danger)' : conflict.severity === 'medium' ? 'var(--warning)' : 'var(--accent)'
              
              return (
                <div key={conflict.id} className="p-5 rounded-xl border transition-colors" style={{ 
                  background: isResolved ? 'var(--bg-base)' : 'var(--bg-surface)', 
                  borderColor: isResolved ? 'var(--border-subtle)' : severityColor,
                  opacity: isResolved ? 0.7 : 1
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      {isResolved ? <CheckCircle2 className="text-[var(--success)]" size={16} /> : <AlertTriangle style={{ color: severityColor }} size={16} />}
                      {conflict.field_name.replace('_', ' ').toUpperCase()}
                      {!isResolved && conflict.severity && (
                        <Badge variant={conflict.severity === 'high' ? 'danger' : 'warning'}>{conflict.severity.toUpperCase()}</Badge>
                      )}
                    </h4>
                    <div className="flex items-center gap-2">
                      {!isResolved && <span className="text-xs text-[var(--text-muted)]">Confidence: 95%</span>}
                      {isResolved ? <Badge variant="success">RESOLVED</Badge> : <Badge variant="neutral">{conflict.status || 'OPEN'}</Badge>}
                    </div>
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
                      <Button variant="secondary" size="sm" onClick={() => resolveConflict(conflict.id, 'IGNORE')}>Ignore</Button>
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
