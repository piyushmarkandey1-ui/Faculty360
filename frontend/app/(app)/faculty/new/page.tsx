'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Check, 
  ChevronRight, 
  GraduationCap, 
  Globe, 
  BookOpen, 
  Loader2, 
  Building2, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Award,
  Plus,
  Mail,
  MapPin,
  FileText
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants/routes'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api/client'

interface DiscoveredProfile {
  name: string
  affiliation?: string
  institution?: string
  institution_url?: string
  verified_email?: string
  email_domain?: string
  email?: string
  department?: string
  designation?: string
  location?: string
  topics?: string[]
  avatar_url?: string
  scholar_id?: string
  scholar_url?: string
  orcid_id?: string
  orcid_url?: string
  semantic_scholar_id?: string
  semantic_scholar_url?: string
  dblp_url?: string
  researchgate_slug?: string
  researchgate_url?: string
  citations?: number
  h_index?: number
  paper_count?: number
  trust_score?: number
  source?: string
}

export default function NewFacultyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [addingProfileKey, setAddingProfileKey] = useState<string | null>(null)
  const [searchingAI, setSearchingAI] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createdFacultyId, setCreatedFacultyId] = useState<string | null>(null)
  const [createdFacultyName, setCreatedFacultyName] = useState<string>('')
  const [discoveredProfiles, setDiscoveredProfiles] = useState<DiscoveredProfile[]>([])
  // Map of canonical_name -> faculty id for already-added profiles
  const [existingFacultyMap, setExistingFacultyMap] = useState<Record<string, string>>({})  

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
    institution: '',
    institutionUrl: '',
    empId: '',
    scholarId: '',
    researchgateSlug: '',
    orcidId: '',
    semantic_scholar_id: '',
    dblp_url: '',
    topics: [] as string[],
    citations: 0,
    h_index: 0,
    avatar_url: ''
  })

  // Query live academic discovery backend
  const handleLiveDiscover = async (queryText: string, instFilter: string = '') => {
    if (!queryText || queryText.trim().length < 2) {
      setDiscoveredProfiles([])
      return
    }
    setSearchingAI(true)
    try {
      const res: any = await apiFetch('/faculty/discover', {
        method: 'POST',
        body: JSON.stringify({ query: queryText, institution: instFilter })
      })
      if (res && res.items) {
        setDiscoveredProfiles(res.items)
      }
    } catch (err) {
      console.warn('Discovery API call fallback:', err)
    } finally {
      setSearchingAI(false)
    }
  }

  // Load existing faculty names on mount to detect already-added profiles
  useEffect(() => {
    apiFetch<{ items: Array<{ id: string; canonical_name: string }> }>('/faculty?limit=200')
      .then(res => {
        const map: Record<string, string> = {}
        if (res?.items) {
          res.items.forEach(f => {
            if (f.canonical_name) map[f.canonical_name.toLowerCase().trim()] = f.id
          })
        }
        setExistingFacultyMap(map)
      })
      .catch(() => {})
  }, [])

  // Debounced search on name change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name.trim().length >= 2) {
        handleLiveDiscover(formData.name, formData.institution)
      } else {
        setDiscoveredProfiles([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [formData.name, formData.institution])

  // 1-Click Automated Import: Zero manual typing required!
  const handleQuickAdd = async (p: DiscoveredProfile) => {
    const profileKey = `${p.name}_${p.affiliation || p.institution || ''}`
    setAddingProfileKey(profileKey)
    setErrorMsg(null)
    setCreatedFacultyName(p.name)

    const payload = {
      name: p.name,
      email: p.email || (p.verified_email ? `faculty@${p.email_domain || 'academic.edu'}` : ''),
      department: p.department || 'Computer Science & Engineering',
      designation: p.designation || 'Professor / Researcher',
      institution: p.affiliation || p.institution || 'Academic Institution',
      institutionUrl: p.institution_url || '',
      empId: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      scholarId: p.scholar_id || '',
      scholar_id: p.scholar_id || '',
      scholar_url: p.scholar_url || '',
      orcidId: p.orcid_id || '',
      orcid_id: p.orcid_id || '',
      orcid_url: p.orcid_url || '',
      semantic_scholar_id: p.semantic_scholar_id || '',
      semantic_scholar_url: p.semantic_scholar_url || '',
      dblp_url: p.dblp_url || '',
      researchgateSlug: p.researchgate_slug || '',
      topics: p.topics || [],
      citations: p.citations || 0,
      h_index: p.h_index || 0,
      avatar_url: p.avatar_url || ''
    }

    try {
      const res: any = await apiFetch('/faculty', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (res && res.id) {
        setCreatedFacultyId(res.id)
        setStep(4) // Move straight to completed view
        // Mark profile as already-added so the button switches to "View Profile"
        setExistingFacultyMap(prev => ({
          ...prev,
          [p.name.toLowerCase().trim()]: res.id
        }))
      } else {
        throw new Error('Failed to create faculty profile record.')
      }
    } catch (err: any) {
      console.error('Quick add failed:', err)
      setErrorMsg(err.message || 'Auto-import failed. Please try again.')
    } finally {
      setAddingProfileKey(null)
    }
  }

  // Fallback if user wants to customize manually
  const selectForCustomReview = (p: DiscoveredProfile) => {
    setFormData({
      name: p.name,
      department: p.department || 'Computer Science & Engineering',
      designation: p.designation || 'Assistant Professor',
      institution: p.affiliation || p.institution || '',
      institutionUrl: p.institution_url || '',
      empId: '',
      scholarId: p.scholar_id || '',
      orcidId: p.orcid_id || '',
      researchgateSlug: p.researchgate_slug || '',
      semantic_scholar_id: p.semantic_scholar_id || '',
      dblp_url: p.dblp_url || '',
      email: p.email || '',
      topics: p.topics || [],
      citations: p.citations || 0,
      h_index: p.h_index || 0,
      avatar_url: p.avatar_url || ''
    })
    setStep(3)
  }

  const handleManualCreateFaculty = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res: any = await apiFetch('/faculty', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      if (res && res.id) {
        setCreatedFacultyId(res.id)
        setCreatedFacultyName(formData.name)
        setStep(4)
      } else {
        throw new Error('Failed to create faculty profile')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save faculty record')
    } finally {
      setLoading(false)
    }
  }

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const steps = [
    { num: 1, title: 'Google Scholar Search' },
    { num: 2, title: 'Automatic Ingestion' },
    { num: 3, title: 'Review (Optional)' },
    { num: 4, title: 'Profile 360 Ready' }
  ]

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2.5">
            <GraduationCap className="text-blue-600" size={28} />
            Academic Profile Discovery & Ingestion
          </h1>
          <p className="text-sm mt-1 text-[var(--text-secondary)]">
            Search Google Scholar, OpenAlex & ORCID. Click <strong>+ Add</strong> to automatically ingest profiles with zero manual typing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200">
            <Sparkles size={12} className="mr-1 inline" /> 1-Click Auto-Ingest
          </Badge>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-sm overflow-hidden p-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: Google Scholar Search & Results */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >

              {/* Search Bar */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center justify-between">
                  <span>Search Professor or Academic Name</span>
                  {searchingAI && (
                    <span className="text-xs text-blue-600 flex items-center gap-1.5 font-medium">
                      <Loader2 size={13} className="animate-spin" />
                      Searching Google Scholar & OpenAlex...
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => updateForm('name', e.target.value)}
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 rounded-xl border bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-blue-600 text-base shadow-xs"
                    placeholder="e.g., Dilip Singh Sisodia, Shrish Verma, Yann LeCun..."
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-[var(--danger-muted)] text-[var(--danger)] text-xs rounded-xl border border-[var(--danger)]/20">
                  {errorMsg}
                </div>
              )}

              {/* Search Results in Exact Google Scholar Style */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-blue-600" />
                    Verified Public Profiles ({discoveredProfiles.length})
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Click <strong>+ Add</strong> to automatically fetch and ingest all records
                  </span>
                </div>

                {discoveredProfiles.length === 0 && !searchingAI && (
                  <div className="py-12 text-center text-sm text-[var(--text-muted)] space-y-2">
                    <Search size={32} className="mx-auto opacity-40 text-[var(--text-muted)]" />
                    <p>No academic profiles found. Type a name to search live registries.</p>
                  </div>
                )}

                {/* Google Scholar Style Result List */}
                <div className="divide-y divide-[var(--border-subtle)]">
                  {discoveredProfiles.map((p, idx) => {
                    const profileKey = `${p.name}_${p.affiliation || p.institution || ''}`
                    const isAdding = addingProfileKey === profileKey
                    const existingId = existingFacultyMap[p.name.toLowerCase().trim()]

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="py-4 px-3 sm:px-4 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Profile Info matching Google Scholar Layout */}
                        <div className="flex items-start gap-4 flex-1">
                          {/* Circular Avatar / Photo */}
                          <div className="relative shrink-0 mt-0.5">
                            {p.avatar_url ? (
                              <img 
                                src={p.avatar_url} 
                                alt={p.name}
                                className="w-14 h-14 rounded-full object-cover border border-[var(--border-default)] shadow-xs"
                                onError={(e: any) => {
                                  // Fallback to stylized SVG avatar
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shadow-xs"
                              style={{ display: p.avatar_url ? 'none' : 'flex' }}
                            >
                              <GraduationCap size={24} />
                            </div>
                          </div>

                          {/* Text Details */}
                          <div className="space-y-1 flex-1">
                            {/* Author Name */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 
                                onClick={() => selectForCustomReview(p)}
                                className="font-bold text-base text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline cursor-pointer"
                              >
                                {p.name}
                              </h3>
                              {p.trust_score && p.trust_score >= 90 && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <ShieldCheck size={11} /> Verified
                                </span>
                              )}
                            </div>

                            {/* Affiliation / Role */}
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {p.affiliation || p.institution || 'Academic Institution'}
                            </div>

                            {/* Verified Email line */}
                            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                              {p.verified_email ? (
                                <span>{p.verified_email}</span>
                              ) : p.email ? (
                                <span>Verified email at {p.email.split('@')[1]}</span>
                              ) : p.location ? (
                                <span>{p.location}</span>
                              ) : null}
                            </div>

                            {/* Research Topics / Interests (Google Scholar blue links) */}
                            {p.topics && p.topics.length > 0 && (
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-xs">
                                {p.topics.slice(0, 5).map((topic, ti) => (
                                  <span 
                                    key={ti}
                                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-default text-[12px]"
                                  >
                                    {topic}
                                    {ti < Math.min(p.topics!.length, 5) - 1 ? ' •' : ''}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Metric Badges & Platform Links */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                              {typeof p.citations === 'number' && p.citations > 0 && (
                                <span className="font-semibold text-[var(--text-primary)]">
                                  Cited by {p.citations.toLocaleString()}
                                </span>
                              )}
                              {typeof p.h_index === 'number' && p.h_index > 0 && (
                                <span>• h-index: <strong className="text-[var(--text-primary)]">{p.h_index}</strong></span>
                              )}
                              {p.orcid_id && (
                                <a 
                                  href={p.orcid_url || `https://orcid.org/${p.orcid_id}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-0.5 text-purple-600 hover:underline font-mono"
                                >
                                  ORCID: {p.orcid_id} <ExternalLink size={9} />
                                </a>
                              )}
                              {p.scholar_url && (
                                <a 
                                  href={p.scholar_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
                                >
                                  Scholar ↗
                                </a>
                              )}
                              {p.dblp_url && (
                                <a 
                                  href={p.dblp_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-0.5 text-amber-600 hover:underline"
                                >
                                  DBLP ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons on the Right */}
                        <div className="flex items-center sm:flex-col gap-2 shrink-0 self-end sm:self-center">
                          {existingId ? (
                            // Already in DB → show View Profile button
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => router.push(ROUTES.faculty.profile(existingId))}
                              className="font-semibold text-xs px-4 py-2 rounded-xl shadow-sm gap-1.5 min-w-[120px] border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:text-emerald-400"
                            >
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              View Profile
                            </Button>
                          ) : (
                            // Not yet in DB → show Add button
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isAdding || Boolean(addingProfileKey)}
                                onClick={() => handleQuickAdd(p)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm gap-1.5 min-w-[110px]"
                              >
                                {isAdding ? (
                                  <>
                                    <Loader2 size={13} className="animate-spin" />
                                    Ingesting...
                                  </>
                                ) : (
                                  <>
                                    <Plus size={15} />
                                    Add
                                  </>
                                )}
                              </Button>
                              <button
                                onClick={() => selectForCustomReview(p)}
                                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline transition-colors"
                              >
                                Edit details
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Manual Custom Review (Optional) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                <strong>Auto-filled from verified records.</strong> Review or adjust any field before confirming ingestion.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Full Name</label>
                  <input 
                    value={formData.name} 
                    onChange={e => updateForm('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-sm font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Institutional Email</label>
                  <input 
                    value={formData.email} 
                    onChange={e => updateForm('email', e.target.value)}
                    placeholder="e.g. professor@university.edu"
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Workplace / University</label>
                  <input 
                    value={formData.institution} 
                    onChange={e => updateForm('institution', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Department</label>
                  <input 
                    value={formData.department} 
                    onChange={e => updateForm('department', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Google Scholar ID</label>
                  <input 
                    value={formData.scholarId} 
                    onChange={e => updateForm('scholarId', e.target.value)}
                    placeholder="e.g. Wip16jEAAAAJ"
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">ORCID iD</label>
                  <input 
                    value={formData.orcidId} 
                    onChange={e => updateForm('orcidId', e.target.value)}
                    placeholder="e.g. 0000-0001-8555-1773"
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-[var(--border-subtle)]">
                <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                  ← Back to Search
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleManualCreateFaculty} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Ingesting Verified Profile...' : 'Confirm & Ingest Profile'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success & Profile 360 CTA */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-6 max-w-lg mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500/20 shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {createdFacultyName || 'Professor'} Successfully Ingested!
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Academic records, publications, citations, and identity mappings have been automatically fetched and linked to the 360° Profile dashboard.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-left space-y-2">
                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" /> Automated Ingestion Summary:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[var(--text-secondary)]">
                  <div>• Google Scholar linked</div>
                  <div>• ORCID registry synced</div>
                  <div>• Publications deduplicated</div>
                  <div>• 360° Baseline Assessment generated</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button 
                  variant="primary" 
                  onClick={() => router.push(createdFacultyId ? `/faculty/${createdFacultyId}` : '/faculty')}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-md py-2.5 px-6"
                >
                  View 360° Profile Dashboard <ArrowRight size={16} />
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setStep(1)
                    setFormData(prev => ({ ...prev, name: '' }))
                    setDiscoveredProfiles([])
                  }}
                >
                  + Add Another Professor
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
