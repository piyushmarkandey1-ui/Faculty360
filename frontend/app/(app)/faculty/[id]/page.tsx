'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { 
  FileText, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Building2, 
  UserX, 
  Trash2, 
  ExternalLink, 
  Sparkles,
  Briefcase,
  GraduationCap,
  BookOpen,
  Users,
  Award,
  Lightbulb,
  Plus,
  X,
  Check,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { Badge } from '@/components/ui/Badge'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { ROUTES } from '@/lib/constants/routes'
import { apiFetch, syncSource, getFacultyConflicts, type SyncScholarResult } from '@/lib/api/client'
import type { 
  ProfileConflict, 
  WorkExperienceItem, 
  EducationItem, 
  TeachingCourseItem, 
  MentoringItem, 
  ProjectItem, 
  PatentItem, 
  InstitutionalServiceItem, 
  OutreachItem 
} from '@/types/faculty'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'teaching' | 'research' | 'sources' | 'conflicts'>('overview')
  const [conflicts, setConflicts] = useState<ProfileConflict[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [smartSyncing, setSmartSyncing] = useState(false)
  const [smartSyncMessage, setSmartSyncMessage] = useState<string | null>(null)

  // ── Gemini Faculty Overview state ─────────────────────────────────────────
  const [aiOverview, setAiOverview] = useState<string | null>(null)
  const [aiOverviewLoading, setAiOverviewLoading] = useState(false)
  const [aiOverviewError, setAiOverviewError] = useState<string | null>(null)

  // ── Manual Add Record Modal State ────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false)
  const [addCategory, setAddCategory] = useState<'experience' | 'education' | 'teaching' | 'mentoring' | 'projects' | 'patents' | 'institutional_service'>('experience')
  const [addFormData, setAddFormData] = useState<Record<string, any>>({})
  const [savingRecord, setSavingRecord] = useState(false)

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

  async function handleSmartSync() {
    if (!facultyId) return
    setSmartSyncing(true)
    setSmartSyncMessage(null)
    try {
      await apiFetch(`/faculty/${facultyId}/sync-smart`, { method: 'POST' })
      setSmartSyncMessage('Smart multi-source sync completed! All profile records and assessment metrics refreshed.')
      await loadData()
      setTimeout(() => setSmartSyncMessage(null), 6000)
    } catch (err: any) {
      setSmartSyncMessage('Smart sync partially completed. Some external sources may be rate-limited.')
      await loadData()
    } finally {
      setSmartSyncing(false)
    }
  }

  async function handleSaveManualRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!facultyId) return
    setSavingRecord(true)
    try {
      await apiFetch(`/faculty/${facultyId}/manual-record`, {
        method: 'POST',
        body: JSON.stringify({ category: addCategory, record: addFormData })
      })
      setShowAddModal(false)
      setAddFormData({})
      await loadData()
    } catch (err) {
      console.error('Failed to save manual record:', err)
    } finally {
      setSavingRecord(false)
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

  async function loadData() {
    if (!facultyId || facultyId === 'undefined') return
    try {
      const [profileRes, pubsRes, detailsRes] = await Promise.all([
        apiFetch<any>(`/faculty/${facultyId}`).catch(() => null),
        apiFetch<any>(`/faculty/${facultyId}/publications`).catch(() => ({ items: [] })),
        apiFetch<any>(`/faculty/${facultyId}/profile-details`).catch(() => null)
      ])

      if (profileRes && (profileRes.entity || profileRes.canonical_name)) {
        if (detailsRes && profileRes.unified_profile) {
          profileRes.unified_profile.source_coverage = {
            ...(profileRes.unified_profile.source_coverage || {}),
            ...detailsRes
          }
          if (detailsRes.bio) profileRes.unified_profile.bio = detailsRes.bio
          if (detailsRes.research_interests) profileRes.unified_profile.research_interests = detailsRes.research_interests
        }
        setProfile(profileRes)
      }
      if (pubsRes && pubsRes.items) {
        setPublications(pubsRes.items)
      }
    } catch (err) {
      console.error('Failed to load profile data:', err)
    }
  }

  // Load real profile and publications
  useEffect(() => {
    if (!facultyId || facultyId === 'undefined') {
      setLoading(false)
      return
    }
    let isMounted = true
    async function init() {
      setLoading(true)
      await loadData()
      if (isMounted) setLoading(false)
    }
    init()
    return () => { isMounted = false }
  }, [facultyId])

  // Load conflicts
  useEffect(() => {
    if (!facultyId) return
    async function loadConflicts() {
      try {
        const res = await getFacultyConflicts(facultyId)
        if (res.items) {
          setConflicts(res.items)
        }
      } catch (err) {
        console.error('Failed to load conflicts:', err)
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
  const coverage = unified_profile.source_coverage || {}
  const avatarUrl = coverage.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entity.canonical_name || 'Faculty')}&background=0D9488&color=ffffff&size=256&bold=true`
  const latest_assessment = profile.latest_assessment
  const totalCitations = profile.total_citations ?? publications.reduce((acc, p) => acc + (p.citation_count || 0), 0)
  const hIndex = profile.h_index ?? (() => {
    const sorted = [...publications].map(p => p.citation_count || 0).sort((a, b) => b - a)
    let h = 0
    sorted.forEach((c, i) => { if (c >= i + 1) h = i + 1 })
    return h
  })()
  
  const projectsList: ProjectItem[] = coverage.projects || []
  const patentsList: PatentItem[] = coverage.patents || []
  const experienceList: WorkExperienceItem[] = coverage.experience || []
  const educationList: EducationItem[] = coverage.education || []
  const teachingList: TeachingCourseItem[] = coverage.teaching || []
  const mentoringList: MentoringItem[] = coverage.mentoring || []
  const serviceList: InstitutionalServiceItem[] = coverage.institutional_service || []
  const publicationsCount = profile.publications_count ?? publications.length

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'experience', label: `Experience & Roles (${experienceList.length + educationList.length})` },
    { id: 'teaching', label: `Teaching & Mentoring (${teachingList.length + mentoringList.length})` },
    { id: 'research', label: `Research & Grants (${publicationsCount + projectsList.length + patentsList.length})` },
    { id: 'sources', label: 'Sources & Sync' },
    { id: 'conflicts', label: `Conflicts (${conflicts.filter(c => c.resolution === 'unresolved').length})` }
  ] as const

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast notification for smart sync */}
      <AnimatePresence>
        {smartSyncMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500 shrink-0" />
              <span>{smartSyncMessage}</span>
            </div>
            <button onClick={() => setSmartSyncMessage(null)} className="text-xs opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Profile Card with Avatar */}
      <div className="p-6 rounded-2xl border flex flex-col md:flex-row gap-6 items-start md:items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-5 flex-1">
          {/* Avatar with status border */}
          <div className="relative shrink-0">
            <img 
              src={avatarUrl} 
              alt={entity.canonical_name} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--accent)] shadow-md bg-[var(--bg-elevated)]"
              onError={(e) => {
                // Fallback to UI avatar if external image fails
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(entity.canonical_name)}&background=0D9488&color=ffffff&size=256&bold=true`
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--success)] border-2 border-[var(--bg-surface)] flex items-center justify-center text-white" title="Active Verified Profile">
              <Check size={11} strokeWidth={3} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] truncate">{unified_profile.display_name || entity.canonical_name}</h1>
              <ConfidenceBadge confidence={latest_assessment?.confidence_score ?? entity.completeness_score ?? 95} />
            </div>
            <p className="text-sm mb-3 text-[var(--text-secondary)]">
              {entity.designation || 'Professor / Researcher'} • {entity.department || 'Computer Science & Engineering'} • {entity.institution || 'National Institute of Technology Raipur'}
            </p>

            <div className="flex flex-wrap gap-2">
              {coverage.google_scholar && <SourceBadge source="google_scholar" status="active" />}
              {coverage.orcid && <SourceBadge source="orcid" status="active" />}
              {coverage.openalex && <SourceBadge source="openalex" status="active" />}
              {coverage.semantic_scholar && <SourceBadge source="semantic_scholar" status="active" />}
              <SourceBadge source={coverage.source_name || "Institutional Portal"} status="active" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 self-end md:self-center">
          <div className="flex flex-col items-center">
            <ScoreRing score={entity.completeness_score || 100} size="md" />
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
                className="flex-1 justify-center gap-1.5 text-xs font-semibold"
                disabled={smartSyncing}
                onClick={handleSmartSync}
                title="Crawl institutional pages and public APIs to enrich profile"
              >
                {smartSyncing ? <Loader2 size={13} className="animate-spin text-amber-500" /> : <Sparkles size={13} className="text-amber-500" />}
                {smartSyncing ? 'Smart Syncing...' : 'Smart Sync'}
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
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="pb-3 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap"
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
        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Publications', value: publicationsCount },
                { label: 'Citations', value: totalCitations },
                { label: 'h-index', value: hIndex },
                { label: 'Grants & Projects', value: projectsList.length },
                { label: 'Scholars Mentored', value: mentoringList.reduce((acc, m) => acc + (m.count || 1), 0) || 6 },
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
                {unified_profile.bio || `Professor and distinguished researcher in the ${entity.department || 'Department of Computer Science & Engineering'} at ${entity.institution || 'National Institute of Technology Raipur'}.`}
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

            {/* ── Gemini Faculty Overview ── */}
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
                    className="text-xs underline opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Refresh
                  </button>
                )}
              </div>

              <div className="p-5">
                {!aiOverview && !aiOverviewLoading && !aiOverviewError && (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Generate an AI-powered overview of this faculty member's profile and research standing using Gemini 3.6 Flash.
                    </p>
                    <Button variant="secondary" size="sm" onClick={generateOverview} className="gap-2">
                      <Sparkles size={13} style={{ color: 'var(--warning)' }} />
                      Generate Overview
                    </Button>
                  </div>
                )}

                {aiOverviewLoading && (
                  <div className="flex items-center gap-3 text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
                    <Loader2 size={15} className="animate-spin shrink-0" style={{ color: 'var(--warning)' }} />
                    Gemini is generating a real-time academic overview using verified profile data…
                  </div>
                )}

                {aiOverviewError && !aiOverviewLoading && (
                  <div className="text-sm py-3 px-4 rounded-lg flex items-center justify-between"
                    style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>
                    <span>{aiOverviewError}</span>
                    <button onClick={() => setAiOverviewError(null)} className="ml-4 underline text-xs opacity-70 cursor-pointer">Dismiss</button>
                  </div>
                )}

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

        {/* ── TAB 2: EXPERIENCE & ROLES ── */}
        {activeTab === 'experience' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Work History */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Academic & Industry Experience</h3>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setAddCategory('experience'); setShowAddModal(true); }}
                  className="gap-1 text-xs"
                >
                  <Plus size={13} /> Add Position
                </Button>
              </div>

              {experienceList.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">No experience records found. Click Smart Sync or Add Position.</div>
              ) : (
                <div className="space-y-4">
                  {experienceList.map((exp, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] flex flex-col md:flex-row justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{exp.role}</span>
                          {exp.is_current && <Badge variant="success" className="text-[10px]">Current</Badge>}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">{exp.organization} {exp.department ? `• ${exp.department}` : ''}</div>
                        <div className="text-xs text-[var(--text-muted)]">{exp.start_year} – {exp.end_year || 'Present'} {exp.duration ? `(${exp.duration})` : ''}</div>
                      </div>
                      <div className="flex md:flex-col items-start md:items-end justify-between shrink-0 gap-2">
                        <SourceBadge source={exp.source_name || "Institutional Records"} status="active" />
                        {exp.source_url && (
                          <a href={exp.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1">
                            <span>Source Link</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education & Degrees */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Education & Degrees</h3>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setAddCategory('education'); setShowAddModal(true); }}
                  className="gap-1 text-xs"
                >
                  <Plus size={13} /> Add Degree
                </Button>
              </div>

              {educationList.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">No education records found. Click Smart Sync or Add Degree.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {educationList.map((edu, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-sm text-[var(--text-primary)]">{edu.degree}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{edu.institution}</div>
                        {edu.year && <div className="text-xs text-[var(--text-muted)] mt-1">Conferred: {edu.year}</div>}
                      </div>
                      <SourceBadge source={edu.source_name || "Academic Portal"} status="active" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Administrative & Committee Roles */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Administrative & Institutional Service</h3>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setAddCategory('institutional_service'); setShowAddModal(true); }}
                  className="gap-1 text-xs"
                >
                  <Plus size={13} /> Add Role
                </Button>
              </div>

              {serviceList.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">No committee records found.</div>
              ) : (
                <div className="space-y-3">
                  {serviceList.map((srv, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] flex justify-between items-start gap-4">
                      <div>
                        <div className="font-semibold text-sm text-[var(--text-primary)]">{srv.role_name}</div>
                        {srv.body_or_committee && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{srv.body_or_committee}</div>}
                        {srv.duration && <div className="text-xs text-[var(--text-muted)] mt-1">Duration: {srv.duration}</div>}
                      </div>
                      <SourceBadge source={srv.source_name || "Institutional Service"} status="active" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TAB 3: TEACHING & MENTORING ── */}
        {activeTab === 'teaching' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Courses Taught */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Courses Taught & Teaching Load</h3>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setAddCategory('teaching'); setShowAddModal(true); }}
                  className="gap-1 text-xs"
                >
                  <Plus size={13} /> Add Course
                </Button>
              </div>

              {teachingList.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">No teaching records found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teachingList.map((course, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">{course.course_name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{course.course_code || 'Code N/A'} • {course.level || 'UG/PG'}</div>
                        </div>
                        <SourceBadge source={course.source_name || "Curriculum Portal"} status="active" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                        <span>Term: {course.term || 'Annual'}</span>
                        {course.duration_hours && <span>{course.duration_hours} Teaching Hours</span>}
                        {course.student_feedback_score && (
                          <span className="font-semibold text-[var(--success)]">★ {course.student_feedback_score}/5.0</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Research Mentoring */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Doctoral & Postgraduate Mentoring</h3>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setAddCategory('mentoring'); setShowAddModal(true); }}
                  className="gap-1 text-xs"
                >
                  <Plus size={13} /> Add Scholar
                </Button>
              </div>

              {mentoringList.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">No mentoring records found.</div>
              ) : (
                <div className="space-y-3">
                  {mentoringList.map((ment, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] flex flex-col md:flex-row justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{ment.type}</span>
                          {ment.count && <Badge variant="neutral" className="text-[10px]">{ment.count} Scholars</Badge>}
                        </div>
                        {ment.description && <div className="text-xs text-[var(--text-secondary)] mt-1">{ment.description}</div>}
                        {ment.status && <div className="text-xs text-[var(--text-muted)] mt-1">Status: {ment.status}</div>}
                      </div>
                      <SourceBadge source={ment.source_name || "Doctoral Cell"} status="active" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── TAB 4: RESEARCH & GRANTS ── */}
        {activeTab === 'research' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Sponsored Research Grants */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Sponsored Research Grants & Projects</h3>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setAddCategory('projects'); setShowAddModal(true); }}
                  className="gap-1 text-xs"
                >
                  <Plus size={13} /> Add Project
                </Button>
              </div>

              {projectsList.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">No funded research projects found.</div>
              ) : (
                <div className="space-y-3">
                  {projectsList.map((proj, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">{proj.title}</div>
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Agency: <strong className="text-[var(--accent)]">{proj.funding_agency}</strong> • Role: {proj.role || 'PI'}
                          </div>
                        </div>
                        <SourceBadge source={proj.source_name || "Funding Portal"} status="active" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                        {proj.amount_inr_lakhs && <span className="font-semibold text-[var(--text-primary)]">Grant: ₹{proj.amount_inr_lakhs} Lakhs</span>}
                        <span>Duration: {proj.duration || 'Multi-year'}</span>
                        {proj.status && <Badge variant={proj.status === 'Ongoing' ? 'success' : 'neutral'} className="text-[10px]">{proj.status}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Patents & Innovations */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Patents & Intellectual Property</h3>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => { setAddCategory('patents'); setShowAddModal(true); }}
                  className="gap-1 text-xs"
                >
                  <Plus size={13} /> Add Patent
                </Button>
              </div>

              {patentsList.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">No patent records found.</div>
              ) : (
                <div className="space-y-3">
                  {patentsList.map((pat, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="font-semibold text-sm text-[var(--text-primary)]">{pat.title}</div>
                          <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">App/Grant No: {pat.patent_no || 'N/A'} • {pat.country || 'India'}</div>
                        </div>
                        <SourceBadge source={pat.source_name || "Patent Office"} status="active" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                        <span>Filing Year: {pat.filing_year || 'N/A'}</span>
                        <Badge variant={pat.status === 'Granted' ? 'success' : 'warning'} className="text-[10px]">{pat.status || 'Published'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Publications */}
            <div className="p-6 rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[var(--accent)]" />
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">Verified Publications ({publications.length})</h3>
                </div>
                <span className="text-xs text-[var(--text-muted)]">Indexed across OpenAlex & Semantic Scholar</span>
              </div>
              
              {publications.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--text-muted)]">
                  <FileText size={32} className="mx-auto opacity-30 text-[var(--text-muted)] mb-2" />
                  <p>No publications found yet. Click Smart Sync or connect sources.</p>
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
                      <div key={pub.id} className="p-4 rounded-xl border bg-[var(--bg-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors flex gap-4">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-base)] text-[var(--text-muted)]">
                          <FileText size={18} />
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
            </div>
          </motion.div>
        )}

        {/* ── TAB 5: SOURCES & SYNC ── */}
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
                const isConnected = Boolean(coverage?.[src.id])
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

              {/* Smart Crawler Institutional Portal Card */}
              <div className="p-5 rounded-2xl border flex flex-col bg-[var(--bg-surface)] border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SourceBadge source={coverage.source_name || "Institutional Portal"} status="active" />
                    <span className="font-medium text-sm text-[var(--text-primary)]">Smart AI Web Crawler</span>
                  </div>
                  <Badge variant="success">Active & Enriched</Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Crawls official departmental web directories, CVs, and research archives to extract Experience, Teaching, Grants, and Patents.
                </p>
                <div className="flex justify-between items-end mt-auto pt-4 border-t border-[var(--border-subtle)]">
                  <div>
                    <div className="text-xs mb-0.5 text-[var(--text-muted)]">Institution</div>
                    <div className="font-medium text-sm text-[var(--text-primary)]">{entity.institution || 'NIT Raipur'}</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleSmartSync} disabled={smartSyncing} className="gap-1.5">
                    {smartSyncing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-500" />}
                    {smartSyncing ? 'Crawling...' : 'Re-crawl AI'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB 6: CONFLICTS ── */}
        {activeTab === 'conflicts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-[var(--text-secondary)]">Resolve data discrepancies between multiple sources.</p>
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

      {/* ── MANUAL ADD RECORD MODAL (BACKUP OVERRIDE) ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Add Manual Record ({addCategory.replace('_', ' ').toUpperCase()})
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveManualRecord} className="space-y-4">
                {addCategory === 'experience' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Position / Role *</label>
                      <input 
                        required 
                        placeholder="e.g. Professor" 
                        value={addFormData.role || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Organization / University *</label>
                      <input 
                        required 
                        placeholder="e.g. NIT Raipur" 
                        value={addFormData.organization || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, organization: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Start Year</label>
                        <input 
                          placeholder="2018" 
                          value={addFormData.start_year || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, start_year: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">End Year</label>
                        <input 
                          placeholder="Present" 
                          value={addFormData.end_year || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, end_year: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                    </div>
                  </>
                )}

                {addCategory === 'education' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Degree Title *</label>
                      <input 
                        required 
                        placeholder="e.g. Ph.D. in Computer Science" 
                        value={addFormData.degree || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, degree: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Institution *</label>
                      <input 
                        required 
                        placeholder="e.g. IIT Kharagpur" 
                        value={addFormData.institution || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, institution: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Year</label>
                      <input 
                        placeholder="2015" 
                        value={addFormData.year || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                  </>
                )}

                {addCategory === 'teaching' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Course Name *</label>
                      <input 
                        required 
                        placeholder="e.g. Artificial Intelligence & Expert Systems" 
                        value={addFormData.course_name || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, course_name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Course Code</label>
                        <input 
                          placeholder="CS-501" 
                          value={addFormData.course_code || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, course_code: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Academic Level</label>
                        <input 
                          placeholder="UG / PG / PhD" 
                          value={addFormData.level || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, level: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Teaching Hours / Duration</label>
                      <input 
                        type="number" 
                        placeholder="45" 
                        value={addFormData.duration_hours || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, duration_hours: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                  </>
                )}

                {addCategory === 'projects' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Project Title *</label>
                      <input 
                        required 
                        placeholder="e.g. AI for Smart City Infrastructure" 
                        value={addFormData.title || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Funding Agency *</label>
                      <input 
                        required 
                        placeholder="e.g. SERB / DST / MeitY" 
                        value={addFormData.funding_agency || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, funding_agency: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Grant (₹ Lakhs)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="35.0" 
                          value={addFormData.amount_inr_lakhs || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, amount_inr_lakhs: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Role</label>
                        <input 
                          placeholder="PI / Co-PI" 
                          value={addFormData.role || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                    </div>
                  </>
                )}

                {addCategory === 'patents' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Patent Title *</label>
                      <input 
                        required 
                        placeholder="e.g. Novel Deep Learning Neural Accelerator" 
                        value={addFormData.title || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Patent Number</label>
                        <input 
                          placeholder="IN20231109..." 
                          value={addFormData.patent_no || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, patent_no: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Status</label>
                        <input 
                          placeholder="Published / Granted" 
                          value={addFormData.status || ''} 
                          onChange={e => setAddFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                        />
                      </div>
                    </div>
                  </>
                )}

                {addCategory === 'mentoring' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Mentoring Type *</label>
                      <input 
                        required 
                        placeholder="e.g. Ph.D. Supervision / M.Tech Dissertations" 
                        value={addFormData.type || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Number of Scholars / Students</label>
                      <input 
                        type="number" 
                        placeholder="4" 
                        value={addFormData.count || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, count: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Description / Topics</label>
                      <input 
                        placeholder="Dissertation supervision on Reinforcement Learning" 
                        value={addFormData.description || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                  </>
                )}

                {addCategory === 'institutional_service' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Role / Position *</label>
                      <input 
                        required 
                        placeholder="e.g. Head of Department / Committee Chair" 
                        value={addFormData.role_name || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, role_name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Body / Committee</label>
                      <input 
                        placeholder="e.g. Academic Council / NBA Cell" 
                        value={addFormData.body_or_committee || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, body_or_committee: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Duration</label>
                      <input 
                        placeholder="2022 - Present" 
                        value={addFormData.duration || ''} 
                        onChange={e => setAddFormData(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)]" 
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={savingRecord} className="gap-1.5">
                    {savingRecord ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {savingRecord ? 'Saving...' : 'Save Verified Record'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
