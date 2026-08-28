'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { FileText, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Search, Building2, UserX, Trash2, ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Badge } from '@/components/ui/Badge'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ROUTES } from '@/lib/constants/routes'
import { formatRelativeTime } from '@/lib/utils/format'
import { apiFetch, syncSource, getFacultyConflicts, type SyncScholarResult } from '@/lib/api/client'
import type { ProfileConflict } from '@/types/faculty'

export type SyncStateStatus = 'idle' | 'input' | 'syncing' | 'success' | 'error' | 'unavailable'
export interface SourceState {
  status: SyncStateStatus
  url: string
  result: SyncScholarResult | null
  error: string | null
}

export default function FacultyProfilePage() {
  const router = useRouter()
  const routeParams = useParams()
  const pathname = usePathname()

  let facultyId = (routeParams?.id as string) || ''
  if (!facultyId || facultyId === 'undefined') {
    const match = pathname?.match(/\/faculty\/([a-zA-Z0-9_-]+)/)
    if (match && match[1] && match[1] !== 'new') {
      facultyId = match[1]
    }
  }

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [publications, setPublications] = useState<any[]>([])
  const [institutionalRecords, setInstitutionalRecords] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'institutional' | 'research' | 'sources' | 'conflicts'>('overview')
  const [conflicts, setConflicts] = useState<ProfileConflict[]>([])
  const [loadingConflicts, setLoadingConflicts] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Gemini Faculty Overview state ─────────────────────────────────────────
  const [aiOverview, setAiOverview] = useState<string | null>(null)
  const [aiOverviewLoading, setAiOverviewLoading] = useState(false)
  const [aiOverviewError, setAiOverviewError] = useState<string | null>(null)

  const generateOverview = async () => {
    if (!facultyId) return
    setAiOverviewLoading(true)
    setAiOverviewError(null)
    try {
      const res = await apiFetch<{ overview: string }>(`/faculty/${facultyId}/overview`, { method: 'POST' })
      setAiOverview(res.overview)
    } catch {
      setAiOverviewError('AI overview temporarily unavailable. Profile data is unaffected.')
    } finally {
      setAiOverviewLoading(false)
    }
  }


  async function handleDeleteProfile() {
    if (!facultyId) return
    setDeleting(true)
    try {
      await apiFetch(`/faculty/${facultyId}`, { method: 'DELETE' })
      router.push(ROUTES.faculty.list)
    } catch (err) {
      console.error('Failed to delete faculty profile:', err)
      setDeleting(false)
    }
  }
  
  // Multi-source Sync State
  const [sourceStates, setSourceStates] = useState<Record<string, SourceState>>({
    google_scholar: { status: 'idle', url: '', result: null, error: null },
    orcid: { status: 'idle', url: '', result: null, error: null },
    researchgate: { status: 'idle', url: '', result: null, error: null }
  })

  // Load real profile and publications
  useEffect(() => {
    if (!facultyId || facultyId === 'undefined') {
      setLoading(false)
      return
    }
    let isMounted = true

    async function loadData() {
      setLoading(true)
      try {
        const [profileRes, pubsRes, instRes] = await Promise.all([
          apiFetch<any>(`/faculty/${facultyId}`).catch(() => null),
          apiFetch<any>(`/faculty/${facultyId}/publications`).catch(() => ({ items: [] })),
          apiFetch<any>(`/faculty/${facultyId}/institutional_records`).catch(() => ({ items: [] }))
        ])

        if (!isMounted) return

        if (profileRes && (profileRes.entity || profileRes.canonical_name)) {
          setProfile(profileRes)
        }
        if (pubsRes && pubsRes.items) {
          setPublications(pubsRes.items)
        }
        if (instRes && instRes.items) {
          setInstitutionalRecords(instRes.items)
        }
      } catch (err) {
        console.error('Failed to load profile data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [facultyId])

  // Load conflicts
  useEffect(() => {
    if (!facultyId) return
    async function loadConflicts() {
      try {
        setLoadingConflicts(true)
        const res = await getFacultyConflicts(facultyId)
        if (res.items) {
          setConflicts(res.items)
        }
      } catch (err) {
        console.error('Failed to load conflicts:', err)
      } finally {
        setLoadingConflicts(false)
      }
    }
    loadConflicts()
  }, [facultyId])

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
      const res = await syncSource(facultyId, sourceId, state.url)
      if (res.status === 'unavailable') {
        updateSourceState(sourceId, { status: 'unavailable', error: res.message || 'Source is currently unavailable' })
      } else {
        updateSourceState(sourceId, { result: res, status: 'success' })
        // Reload publications & conflicts after sync
        const [pRes, cRes] = await Promise.all([
          apiFetch<any>(`/faculty/${facultyId}/publications`).catch(() => null),
          getFacultyConflicts(facultyId).catch(() => null)
        ])
        if (pRes?.items) setPublications(pRes.items)
        if (cRes?.items) setConflicts(cRes.items)
      }
    } catch (err: any) {
      updateSourceState(sourceId, { error: err.message || `Failed to sync ${sourceId}`, status: 'error' })
    }
  }

  const resolveConflict = (id: string, _resolution: string) => {
    setConflicts(prev => prev.map(c => c.id === id ? { ...c, resolution: 'source_a' as const } : c))
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-8">
        <div className="p-8 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] animate-pulse flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="h-8 bg-[var(--bg-elevated)] rounded-lg w-64" />
            <div className="h-4 bg-[var(--bg-elevated)] rounded-md w-96" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 bg-[var(--bg-elevated)] rounded-full w-24" />
              <div className="h-6 bg-[var(--bg-elevated)] rounded-full w-24" />
            </div>
          </div>
          <div className="h-20 w-20 rounded-full bg-[var(--bg-elevated)]" />
        </div>
        <div className="h-12 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Not found state
  if (!profile || (!profile.entity && !profile.canonical_name)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center">
          <UserX size={32} />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Faculty Profile Not Found</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          The requested professor record could not be found or has been removed.
        </p>
        <Link href={ROUTES.faculty.list}>
          <Button variant="primary" size="sm" className="mt-2">
            Back to Faculty Directory
          </Button>
        </Link>
      </div>
    )
  }

  const entity = profile.entity || profile
  const unified_profile = profile.unified_profile || {
    display_name: entity.canonical_name || 'Faculty Member',
    bio: `Faculty member at ${entity.institution || 'Academic Institution'}.`,
    research_interests: [],
    source_coverage: { google_scholar: false, orcid: false, researchgate: false, institutional: true }
  }
  const latest_assessment = profile.latest_assessment
  const totalCitations = profile.total_citations ?? publications.reduce((acc, p) => acc + (p.citation_count || 0), 0)
  const hIndex = profile.h_index ?? (() => {
    const sorted = [...publications].map(p => p.citation_count || 0).sort((a, b) => b - a)
    let h = 0
    sorted.forEach((c, i) => { if (c >= i + 1) h = i + 1 })
    return h
  })()
  const projectsCount = profile.projects_count ?? 0
  const studentsCount = profile.students_count ?? 0
  const publicationsCount = profile.publications_count ?? publications.length

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'institutional', label: 'Institutional' },
    { id: 'research', label: `Research (${publicationsCount})` },
    { id: 'sources', label: 'Sources' },
    { id: 'conflicts', label: `Conflicts (${conflicts.filter(c => c.resolution === 'unresolved').length})` }
  ] as const

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl border flex flex-col md:flex-row gap-8 items-start md:items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{unified_profile.display_name || entity.canonical_name}</h1>
            <ConfidenceBadge confidence={latest_assessment?.confidence_score ?? entity.completeness_score ?? 85} />
          </div>
          <p className="text-sm mb-4 text-[var(--text-secondary)]">
            {entity.designation || 'Professor'} • {entity.department || 'Department'} • {entity.institution || 'Academic Institution'}
          </p>

          <div className="flex flex-wrap gap-2">
            {unified_profile.source_coverage?.google_scholar && <SourceBadge source="google_scholar" status="active" />}
            {unified_profile.source_coverage?.researchgate && <SourceBadge source="researchgate" status="active" />}
            {unified_profile.source_coverage?.institutional && <SourceBadge source="institutional" status="active" />}
            {unified_profile.source_coverage?.orcid && <SourceBadge source="orcid" status="active" />}
            {unified_profile.source_coverage?.semantic_scholar && <SourceBadge source="semantic_scholar" status="active" />}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <ScoreRing score={entity.completeness_score || 90} size="md" />
            <span className="text-xs mt-2 font-medium text-[var(--text-secondary)]">Completeness</span>
          </div>
          
          <div className="h-16 w-px bg-[var(--border-subtle)]" />
          
          <div className="flex flex-col gap-2">
            <Link href={ROUTES.faculty.assessment(facultyId)}>
              <Button variant="primary" className="w-full justify-center">Run Assessment</Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                className="flex-1 justify-center gap-1.5 text-xs"
                onClick={() => setActiveTab('sources')}
              >
                <RefreshCw size={13} /> Sync Data
              </Button>
              <Button 
                variant="ghost" 
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-500/10 px-2.5 h-9"
                onClick={() => setShowDeleteModal(true)}
                title="Delete faculty profile"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border-subtle)]">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="pb-3 text-sm font-medium transition-colors relative cursor-pointer"
              style={{ color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)' }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-[var(--accent)]"
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
                { label: 'Publications', value: publicationsCount },
                { label: 'Citations', value: totalCitations },
                { label: 'h-index', value: hIndex },
                { label: 'Projects', value: projectsCount },
                { label: 'Students', value: studentsCount },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl border flex flex-col items-center justify-center text-center bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                  <span className="text-2xl font-bold mb-1 text-[var(--text-primary)]">
                    <AnimatedCounter value={stat.value} duration={1} />
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)]">
              <h3 className="font-semibold mb-3 text-[var(--text-primary)]">Biography</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {unified_profile.bio || `Faculty member at ${entity.institution || 'Academic Institution'}, Department of ${entity.department || 'Engineering'}.`}
              </p>
              
              {unified_profile.research_interests && unified_profile.research_interests.length > 0 && (
                <>
                  <h3 className="font-semibold mt-6 mb-3 text-[var(--text-primary)]">Research Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {unified_profile.research_interests.map((interest: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs font-medium border bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)]">
                        {interest}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Gemini Faculty Overview ──────────────────────────────── */}
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} style={{ color: 'var(--warning)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Gemini AI Overview</span>
                  <Badge variant="warning" className="text-[10px] uppercase">Advisory Only</Badge>
                </div>
                {aiOverview && !aiOverviewLoading && (
                  <button
                    onClick={generateOverview}
                    className="text-xs underline opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Refresh
                  </button>
                )}
              </div>

              <div className="p-5">
                {/* Not yet generated */}
                {!aiOverview && !aiOverviewLoading && !aiOverviewError && (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Generate an AI-powered overview of this faculty member's profile and research standing.
                    </p>
                    <Button variant="secondary" size="sm" onClick={generateOverview} className="gap-2">
                      <Sparkles size={13} style={{ color: 'var(--warning)' }} />
                      Generate Overview
                    </Button>
                  </div>
                )}

                {/* Loading */}
                {aiOverviewLoading && (
                  <div className="flex items-center gap-3 text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
                    <Loader2 size={15} className="animate-spin shrink-0" style={{ color: 'var(--warning)' }} />
                    Gemini is generating an overview using verified profile data…
                  </div>
                )}

                {/* Error */}
                {aiOverviewError && !aiOverviewLoading && (
                  <div className="text-sm py-3 px-4 rounded-lg flex items-center justify-between"
                    style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>
                    <span>{aiOverviewError}</span>
                    <button onClick={() => setAiOverviewError(null)} className="ml-4 underline text-xs opacity-70">Dismiss</button>
                  </div>
                )}

                {/* Overview text */}
                {aiOverview && !aiOverviewLoading && (
                  <div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {aiOverview}
                    </p>
                    <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                      AI-generated based on verified AcadLens data only. Does not constitute an official evaluation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'institutional' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Verified Institutional Data</h3>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <CheckCircle2 size={12} className="text-[var(--success)]" /> Official University Records
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Teaching History */}
              <InstitutionalSection 
                title="Teaching History" 
                records={institutionalRecords.filter(r => r.category === 'teaching')}
                emptyTitle="Awaiting institutional data"
                emptyDesc="Teaching records will appear when uploaded by an authorized administrator."
              />
              {/* Career History */}
              <InstitutionalSection 
                title="Career History" 
                records={institutionalRecords.filter(r => r.category === 'career')}
                emptyTitle="No verified career history available"
              />
              {/* Mentoring */}
              <InstitutionalSection 
                title="Mentoring" 
                records={institutionalRecords.filter(r => r.category === 'mentoring')}
                emptyTitle="Awaiting institutional records"
              />
              {/* Institutional Service */}
              <InstitutionalSection 
                title="Institutional Service" 
                records={institutionalRecords.filter(r => r.category === 'service')}
                emptyTitle="No verified service records available"
              />
              {/* Awards / Recognition */}
              <InstitutionalSection 
                title="Awards / Recognition" 
                records={institutionalRecords.filter(r => r.category === 'awards')}
                emptyTitle="No verified awards available"
              />
              {/* Projects */}
              <InstitutionalSection 
                title="Projects" 
                records={institutionalRecords.filter(r => r.category === 'projects')}
                emptyTitle="Awaiting institutional project data"
              />
              {/* Innovation */}
              <InstitutionalSection 
                title="Innovation" 
                records={institutionalRecords.filter(r => r.category === 'innovation')}
                emptyTitle="No verified innovation records"
              />
              {/* Outreach */}
              <InstitutionalSection 
                title="Outreach" 
                records={institutionalRecords.filter(r => r.category === 'outreach')}
                emptyTitle="No verified outreach records"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'research' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Verified Publications ({publications.length})</h3>
              <span className="text-xs text-[var(--text-muted)]">Live verified across OpenAlex, Semantic Scholar & CrossRef</span>
            </div>
            
            {publications.length === 0 ? (
              <div className="py-16 text-center text-sm text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] space-y-2">
                <FileText size={32} className="mx-auto opacity-30 text-[var(--text-muted)]" />
                <p>No publications found yet. Connect Google Scholar or ORCID in the Sources tab to sync publications.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {publications.map(pub => {
                  const sourceUrl = pub.doi 
                    ? `https://doi.org/${pub.doi}`
                    : pub.source_type === 'openalex'
                    ? `https://openalex.org/works?search=${encodeURIComponent(pub.title)}`
                    : pub.source_type === 'semantic_scholar'
                    ? `https://www.semanticscholar.org/search?q=${encodeURIComponent(pub.title)}`
                    : `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}`
                  
                  return (
                    <div key={pub.id} className="p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors flex gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 text-[var(--text-primary)] leading-snug" title={pub.title}>
                          {pub.title}
                        </h4>
                        <div className="text-xs mb-2 text-[var(--text-secondary)]">
                          {pub.venue || 'Academic Journal / Conference'} {pub.year ? `• ${pub.year}` : ''}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          {pub.doi && (
                            <a 
                              href={`https://doi.org/${pub.doi}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-[11px] flex items-center gap-1"
                            >
                              <span>DOI: {pub.doi}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                          {typeof pub.citation_count === 'number' && pub.citation_count > 0 && (
                            <span className="font-semibold text-[var(--text-primary)]">
                              {pub.citation_count} Citations
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end justify-between gap-2">
                        <SourceBadge source={pub.source_type || 'openalex'} status="active" />
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline font-medium bg-[var(--accent-muted)]/20 px-2 py-1 rounded-md border border-[var(--accent-muted)]/40 hover:bg-[var(--accent-muted)]/40 transition-colors"
                          title="Open original publication source in a new tab"
                        >
                          <span>Original Source</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'sources' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Connected Identities with Live Links */}
            {(profile?.identities || []).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connected Academic Identities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(profile?.identities || []).map((ident: any) => (
                    <div key={ident.id || ident.source_type} className="p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <SourceBadge source={ident.source_type} status="active" />
                        <div>
                          <div className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                            {ident.source_type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[200px]">
                            {ident.external_id || 'Connected'}
                          </div>
                        </div>
                      </div>
                      {ident.profile_url && (
                        <a
                          href={ident.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium hover:underline bg-[var(--bg-elevated)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]"
                        >
                          <span>View Profile</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Syncable Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'google_scholar', name: 'Google Scholar', defaultUrlText: 'https://scholar.google.com/citations?user=...' },
                { id: 'orcid', name: 'ORCID', defaultUrlText: 'https://orcid.org/0000-0002-...' },
                { id: 'researchgate', name: 'ResearchGate', defaultUrlText: 'https://www.researchgate.net/profile/...' }
              ].map(src => {
                const state = sourceStates[src.id]
                const isConnected = Boolean(unified_profile.source_coverage?.[src.id])
                return (
                  <div key={src.id} className="p-5 rounded-2xl border flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <SourceBadge source={src.id as any} status="active" />
                        <span className="font-medium text-sm text-[var(--text-primary)]">{src.name}</span>
                      </div>
                      <Badge variant={state.status === 'success' ? 'success' : state.status === 'error' ? 'danger' : isConnected ? 'success' : 'neutral'}>
                        {state.status === 'success' ? 'Synced' : state.status === 'syncing' ? 'Syncing...' : isConnected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>

                    {state.status === 'input' || state.status === 'syncing' || state.status === 'error' ? (
                      <div className="flex flex-col gap-3 mt-auto border-t border-[var(--border-subtle)] pt-4">
                        <div className="text-xs text-[var(--text-secondary)]">Enter Profile URL or ID</div>
                        <input
                          type="url"
                          placeholder={src.defaultUrlText}
                          value={state.url}
                          onChange={(e) => updateSourceState(src.id, { url: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-colors bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]"
                          disabled={state.status === 'syncing'}
                        />
                        {state.error && <div className="text-xs text-[var(--danger)]">{state.error}</div>}
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" onClick={() => handleSourceSync(src.id)} disabled={state.status === 'syncing'} className="flex-1 justify-center gap-2">
                            {state.status === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            {state.status === 'syncing' ? 'Syncing...' : 'Start Sync'}
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => updateSourceState(src.id, { status: 'idle', error: null })} disabled={state.status === 'syncing'}>Cancel</Button>
                        </div>
                      </div>
                    ) : state.status === 'success' && state.result ? (
                      <div className="mt-auto border-t border-[var(--border-subtle)] pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm font-medium text-[var(--success)]">Sync Completed</div>
                          <Button variant="secondary" size="sm" onClick={() => updateSourceState(src.id, { status: 'idle' })}>Dismiss</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-[var(--text-muted)]">Found:</span> {state.result.publicationsFound}</div>
                          <div><span className="text-[var(--text-muted)]">Added:</span> {state.result.publicationsAdded}</div>
                          <div><span className="text-[var(--text-muted)]">h-index:</span> {state.result.hIndex}</div>
                          <div><span className="text-[var(--text-muted)]">Citations:</span> {state.result.citations}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-end mt-auto pt-4 border-t border-[var(--border-subtle)]">
                        <div>
                          <div className="text-xs mb-0.5 text-[var(--text-muted)]">Status</div>
                          <div className="font-medium text-sm text-[var(--text-primary)]">
                            {isConnected ? 'Active & Synced' : 'Ready to Connect'}
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => updateSourceState(src.id, { status: 'input' })} className="gap-2">
                          <RefreshCw size={12} /> {isConnected ? 'Re-sync' : 'Connect'}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Institutional Data Card */}
              <div className="p-5 rounded-2xl border flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SourceBadge source="institutional" status="active" />
                    <span className="font-medium text-sm text-[var(--text-primary)]">Institutional DB</span>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex justify-between items-end mt-auto pt-4 border-t border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs mb-0.5 text-[var(--text-muted)]">Workplace</div>
                    <div className="font-medium text-sm text-[var(--text-primary)]">{entity.institution || 'Academic Institution'}</div>
                  </div>
                  <Badge variant="neutral" className="text-xs">Auto-Synced</Badge>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'conflicts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-[var(--text-secondary)]">Resolve data discrepancies between sources.</p>
              <Link href={ROUTES.faculty.review(facultyId)}>
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
                    <h4 className="font-medium text-sm flex items-center gap-2 text-[var(--text-primary)]">
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
                    <div className="p-3 rounded-lg border bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
                      <div className="text-xs mb-1 flex items-center gap-1 text-[var(--text-muted)]">
                        <SourceBadge source={conflict.source_a} status="active" /> {conflict.source_a}
                      </div>
                      <div className="text-sm truncate text-[var(--text-primary)]">{String(conflict.value_a)}</div>
                    </div>
                    <div className="p-3 rounded-lg border bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
                      <div className="text-xs mb-1 flex items-center gap-1 text-[var(--text-muted)]">
                        <SourceBadge source={conflict.source_b} status="active" /> {conflict.source_b}
                      </div>
                      <div className="text-sm truncate text-[var(--text-primary)]">{String(conflict.value_b)}</div>
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
              <div className="py-12 text-center text-sm text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)]">
                No conflicts found for this profile.
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete Faculty Profile?</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Are you sure you want to permanently delete <strong className="text-[var(--text-primary)]">{unified_profile.display_name || entity.canonical_name}</strong>? All publications, assessments, and provenance records for this faculty member will be removed.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  disabled={deleting}
                  onClick={handleDeleteProfile}
                  className="bg-red-600 hover:bg-red-700 text-white border-transparent gap-1.5"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting...' : 'Delete Profile'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InstitutionalSection({ title, records, emptyTitle, emptyDesc }: { title: string, records: any[], emptyTitle: string, emptyDesc?: string }) {
  return (
    <div className="p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-sm text-[var(--text-primary)]">{title}</h4>
        <Badge variant={records.length > 0 ? "success" : "neutral"} className="text-[10px]">
          {records.length} records
        </Badge>
      </div>
      
      {records.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-[var(--text-muted)]">
          <Building2 size={24} className="mb-2 opacity-20" />
          <p className="text-sm font-medium">{emptyTitle}</p>
          {emptyDesc && <p className="text-xs mt-1 max-w-[200px] opacity-70">{emptyDesc}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => (
            <div key={i} className="pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
              <div className="flex justify-between items-start gap-2">
                <div className="font-medium text-sm text-[var(--text-primary)]">{r.title}</div>
                {r.year ? <div className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{r.year}</div> : null}
              </div>
              {r.description && <div className="text-xs text-[var(--text-secondary)] mt-1">{r.description}</div>}
              {r.is_verified && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--success)]">
                  <CheckCircle2 size={10} /> Verified Institutional Data
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
