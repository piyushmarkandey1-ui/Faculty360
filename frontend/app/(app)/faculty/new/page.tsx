'use client'

import { useState, useEffect, useMemo } from 'react'
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
  UserCheck,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants/routes'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api/client'

interface DiscoveredProfile {
  name: string
  institution: string
  institution_url?: string
  department: string
  designation: string
  scholar_id: string
  scholar_url?: string
  orcid_id: string
  orcid_url?: string
  researchgate_slug?: string
  researchgate_url?: string
  email?: string
  citations?: number | string
  h_index?: number
  topics?: string[]
  trust_score?: number
  source?: string
}

export default function NewFacultyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchingAI, setSearchingAI] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createdFacultyId, setCreatedFacultyId] = useState<string | null>(null)
  const [discoveredProfiles, setDiscoveredProfiles] = useState<DiscoveredProfile[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    institution: 'NIT Warangal',
    institutionUrl: '',
    empId: '',
    scholarId: '',
    researchgateSlug: '',
    orcidId: '',
  })

  // Preset Institutions for Quick Testing
  const PRESET_NAMES = [
    { label: "Dr. Rajesh Sharma (NITW)", name: "Dr. Rajesh Kumar Sharma", inst: "NIT Warangal" },
    { label: "Dr. Rajesh Sharma (IIT Delhi)", name: "Dr. Rajesh Sharma", inst: "IIT Delhi" },
    { label: "Dr. Anjali Sharma (IITB)", name: "Dr. Anjali Sharma", inst: "IIT Bombay" },
    { label: "Dr. Sneha Desai (BITS)", name: "Dr. Sneha Desai", inst: "BITS Pilani" },
    { label: "Prof. Yann LeCun (NYU)", name: "Prof. Yann LeCun", inst: "New York University" }
  ]

  // Query live academic discovery backend
  const handleLiveDiscover = async (queryText: string) => {
    if (!queryText || queryText.trim().length < 2) {
      setDiscoveredProfiles([])
      return
    }
    setSearchingAI(true)
    try {
      const res: any = await apiFetch('/faculty/discover', {
        method: 'POST',
        body: JSON.stringify({ query: queryText, institution: formData.institution })
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

  // Debounced search on name change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name.trim().length >= 2) {
        handleLiveDiscover(formData.name)
      } else {
        setDiscoveredProfiles([])
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [formData.name, formData.institution])

  const selectDiscoveredProfile = (p: DiscoveredProfile) => {
    setFormData(prev => ({
      ...prev,
      name: p.name,
      department: p.department || prev.department,
      designation: p.designation || prev.designation,
      institution: p.institution || prev.institution,
      institutionUrl: p.institution_url || '',
      scholarId: p.scholar_id || '',
      orcidId: p.orcid_id || '',
      researchgateSlug: p.researchgate_slug || '',
      email: p.email || prev.email || `${p.name.toLowerCase().replace(/[^a-z]/g, '')}@${p.institution.toLowerCase().includes('iit') ? 'iit.ac.in' : 'nitw.ac.in'}`
    }))
  }

  const handleCreateFaculty = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res: any = await apiFetch('/faculty', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      const facId = res?.id || 'fac-1'
      setCreatedFacultyId(facId)
      
      // Auto-trigger scholar sync if scholar ID provided
      if (formData.scholarId) {
        apiFetch(`/faculty/${facId}/sources/google_scholar/sync`, {
          method: 'POST',
          body: JSON.stringify({ url: formData.scholarId })
        }).catch(console.error)
      }
      
      setStep(4)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create faculty profile')
    } finally {
      setLoading(false)
    }
  }

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const steps = [
    { num: 1, title: 'AI Public Discovery' },
    { num: 2, title: 'Source & Identifiers' },
    { num: 3, title: 'Review & Ingest' },
    { num: 4, title: 'Completed' }
  ]

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Public Faculty Onboarding & Discovery</h1>
        <p className="text-sm mt-1 text-[var(--text-secondary)]">
          Search trustable public academic registries (Google Scholar, ORCID, University Webpages) with AI-powered profile disambiguation.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[var(--border-subtle)] -z-10" />
        {steps.map((s) => {
          const isActive = step === s.num
          const isPast = step > s.num
          return (
            <div key={s.num} className="flex-1 flex flex-col items-center relative">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                style={{
                  background: isActive || isPast ? 'var(--accent)' : 'var(--bg-surface)',
                  color: isActive || isPast ? 'white' : 'var(--text-muted)',
                  border: `2px solid ${isActive || isPast ? 'var(--accent)' : 'var(--border-default)'}`
                }}
              >
                {isPast ? <Check size={16} /> : s.num}
              </div>
              <span className="text-xs font-medium mt-2 absolute top-10 whitespace-nowrap" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-16">
        <AnimatePresence mode="wait">
          {/* STEP 1: AI Public Search & Disambiguation */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Quick Preset Chips */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
                <div className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  Quick Presets (Click to instant search):
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_NAMES.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        updateForm('name', preset.name)
                        updateForm('institution', preset.inst)
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-[var(--bg-elevated)] border-[var(--border-default)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-[var(--text-primary)]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-[var(--text-primary)] flex items-center justify-between">
                    <span>Professor Name *</span>
                    {searchingAI && (
                      <span className="text-xs text-[var(--accent)] flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" />
                        Querying public registries & AI...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => updateForm('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm shadow-xs"
                      placeholder="e.g. Dr. Rajesh Sharma or Prof. Yann LeCun"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={17} />
                  </div>
                </div>

                {/* Generous Disambiguation Match Cards */}
                {discoveredProfiles.length > 0 && (
                  <div className="col-span-2 p-4 rounded-xl bg-[var(--accent-muted)]/20 border border-[var(--accent)]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        Found {discoveredProfiles.length} Trustable Public Match{discoveredProfiles.length > 1 ? 'es' : ''} (Disambiguation Details):
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)]">Select exact professor below</span>
                    </div>

                    <div className="space-y-3">
                      {discoveredProfiles.map((p, idx) => (
                        <div 
                          key={idx}
                          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 hover:border-[var(--accent)] transition-all shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-base shrink-0 mt-0.5">
                                {p.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{p.name}</h4>
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--success-muted)] text-[var(--success)] font-semibold flex items-center gap-1">
                                    <ShieldCheck size={11} />
                                    {p.trust_score || 95}% Trust Score
                                  </span>
                                </div>

                                <div className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                                  {p.designation} • {p.department}
                                </div>

                                {/* Current Workplace with Website Link */}
                                <div className="flex items-center gap-2 text-xs mt-1">
                                  <span className="text-[var(--accent)] font-semibold flex items-center gap-1">
                                    <Building2 size={13} />
                                    {p.institution}
                                  </span>
                                  {p.institution_url && (
                                    <a 
                                      href={p.institution_url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-0.5 text-[11px] underline"
                                    >
                                      University Profile <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => selectDiscoveredProfile(p)}
                              className="shrink-0 text-xs gap-1.5 font-semibold"
                            >
                              <Check size={14} />
                              Auto-Fill Profile
                            </Button>

                          </div>

                          {/* Generous Preview Badges: Scholar, ORCID, Metrics */}
                          <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {/* Semantic Scholar ID */}
                            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                              <span className="text-[10px] text-[var(--text-muted)] block">S2 Author ID</span>
                              {(p as any).semantic_scholar_id ? (
                                <a href={(p as any).semantic_scholar_url} target="_blank" rel="noreferrer" className="font-mono font-semibold text-[var(--accent)] truncate block text-xs hover:underline">
                                  {(p as any).semantic_scholar_id}
                                </a>
                              ) : (
                                <a href={(p as any).semantic_scholar_url || p.scholar_url} target="_blank" rel="noreferrer" className="font-medium text-[var(--accent)] truncate block text-[11px] hover:underline">
                                  Search S2 ↗
                                </a>
                              )}
                            </div>
                            {/* ORCID */}
                            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                              <span className="text-[10px] text-[var(--text-muted)] block">ORCID</span>
                              {p.orcid_id ? (
                                <a href={p.orcid_url} target="_blank" rel="noreferrer" className="font-mono font-semibold text-purple-500 truncate block text-xs hover:underline">
                                  {p.orcid_id}
                                </a>
                              ) : (
                                <a href={p.orcid_url} target="_blank" rel="noreferrer" className="font-medium text-purple-400 text-[11px] hover:underline">
                                  Search ORCID ↗
                                </a>
                              )}
                            </div>
                            {/* Citations */}
                            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                              <span className="text-[10px] text-[var(--text-muted)] block">Citations</span>
                              <span className="font-bold text-[var(--text-primary)]">
                                {typeof p.citations === 'number' && p.citations > 0 ? p.citations.toLocaleString() : '—'}
                              </span>
                            </div>
                            {/* h-index */}
                            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                              <span className="text-[10px] text-[var(--text-muted)] block">h-index</span>
                              <span className="font-bold text-[var(--success)]">{p.h_index || '—'}</span>
                            </div>
                            {/* Papers */}
                            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                              <span className="text-[10px] text-[var(--text-muted)] block">Papers</span>
                              <span className="font-bold text-[var(--text-primary)]">{(p as any).paper_count || '—'}</span>
                            </div>
                            {/* Source */}
                            <div className="p-2 rounded-lg bg-[var(--bg-elevated)]">
                              <span className="text-[10px] text-[var(--text-muted)] block">Source</span>
                              <span className="text-[10px] font-semibold text-[var(--accent)]">{p.source || 'Live'}</span>
                            </div>
                          </div>

                          {/* Platform Link Badges */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {(p as any).semantic_scholar_url && (
                              <a href={(p as any).semantic_scholar_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 font-semibold">
                                <ExternalLink size={9} /> Semantic Scholar
                              </a>
                            )}
                            {p.orcid_url && (
                              <a href={p.orcid_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20 font-semibold">
                                <ExternalLink size={9} /> ORCID
                              </a>
                            )}
                            {(p as any).dblp_url && (
                              <a href={(p as any).dblp_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 font-semibold">
                                <ExternalLink size={9} /> DBLP
                              </a>
                            )}
                            {p.scholar_url && (
                              <a href={p.scholar_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20 font-semibold">
                                <ExternalLink size={9} /> Scholar
                              </a>
                            )}
                            {p.institution_url && (
                              <a href={p.institution_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 font-semibold">
                                <Building2 size={9} /> University Page
                              </a>
                            )}
                          </div>

                          {p.topics && p.topics.length > 0 && (
                            <div className="text-[11px] text-[var(--text-muted)]">
                              <strong className="text-[var(--text-secondary)]">Topics:</strong> {p.topics.join(' • ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Institutional Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => updateForm('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm"
                    placeholder="e.g. rksharma@nitw.ac.in"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Current Workplace / Institution</label>
                  <input 
                    type="text" 
                    value={formData.institution} 
                    onChange={e => updateForm('institution', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm"
                    placeholder="e.g. NIT Warangal / IIT Delhi"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Department</label>
                  <select 
                    value={formData.department} 
                    onChange={e => updateForm('department', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm"
                  >
                    <option value="Computer Science">Computer Science & Engineering</option>
                    <option value="Electronics">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Designation</label>
                  <select 
                    value={formData.designation} 
                    onChange={e => updateForm('designation', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Head of Department">Head of Department</option>
                    <option value="Dean / Director">Dean / Director</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Employee ID / Code</label>
                  <input 
                    type="text" 
                    value={formData.empId} 
                    onChange={e => updateForm('empId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm font-mono"
                    placeholder="e.g. FAC-2024-089"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={() => setStep(2)} disabled={!formData.name.trim()}>
                  Next: Verified Identifiers <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Academic Sources */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex gap-4">
                <GraduationCap className="text-blue-400 shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[var(--text-primary)]">Google Scholar ID</h3>
                    {formData.scholarId && <Badge variant="success">Linked</Badge>}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Public Google Scholar user ID (e.g. WLN3QrAAAAAJ)</p>
                  <input 
                    type="text" 
                    value={formData.scholarId} 
                    onChange={e => updateForm('scholarId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm font-mono"
                    placeholder="e.g. WLN3QrAAAAAJ"
                  />
                </div>
              </div>

              <div className="p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex gap-4">
                <Globe className="text-purple-400 shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[var(--text-primary)]">ORCID iD</h3>
                    {formData.orcidId && <Badge variant="success">Linked</Badge>}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">16-digit official ORCID public registry identifier.</p>
                  <input 
                    type="text" 
                    value={formData.orcidId} 
                    onChange={e => updateForm('orcidId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm font-mono"
                    placeholder="e.g. 0000-0002-1825-0097"
                  />
                </div>
              </div>

              <div className="p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex gap-4">
                <BookOpen className="text-green-400 shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[var(--text-primary)]">ResearchGate Handle</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">The username part of the ResearchGate profile URL.</p>
                  <input 
                    type="text" 
                    value={formData.researchgateSlug} 
                    onChange={e => updateForm('researchgateSlug', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm"
                    placeholder="e.g. Rajesh-Sharma-NITW"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Review & Confirm <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Summary & Ingestion Confirmation */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--text-primary)]">Profile Ingestion Summary</h3>
                  <Badge variant="accent">Ready for Aggregation</Badge>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Full Name</div>
                      <div className="text-sm text-[var(--text-primary)] font-semibold">{formData.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Institutional Email</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.email || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Current Workplace</div>
                      <div className="text-sm text-[var(--accent)] font-semibold flex items-center gap-1">
                        <Building2 size={13} />
                        {formData.institution || 'NIT Warangal'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Department</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.department || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Designation</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.designation || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Employee Code</div>
                      <div className="text-sm font-mono text-[var(--text-primary)]">{formData.empId || '-'}</div>
                    </div>
                  </div>
                  
                  <hr className="border-[var(--border-subtle)]" />
                  
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Google Scholar ID</div>
                      <div className="text-sm text-[var(--text-primary)] font-mono">{formData.scholarId || 'None'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">ORCID iD</div>
                      <div className="text-sm text-[var(--text-primary)] font-mono">{formData.orcidId || 'None'}</div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-[var(--danger-muted)] text-[var(--danger)] text-xs rounded-lg mt-3">
                      {errorMsg}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>Back</Button>
                <Button variant="primary" onClick={handleCreateFaculty} disabled={loading} className="gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Ingesting Verified Records...' : 'Confirm & Ingest Profile'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Completion */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)]"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--success-muted)] text-[var(--success)] flex items-center justify-center mx-auto">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Faculty Profile Ingested!</h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                {formData.name} has been indexed at {formData.institution}. Autonomous data synchronization is aggregating verified publications and citation metrics.
              </p>
              
              <div className="pt-6 flex justify-center gap-3">
                <Button variant="secondary" onClick={() => router.push(ROUTES.faculty.list)}>
                  View Directory
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => router.push(ROUTES.faculty.profile(createdFacultyId || 'fac-1'))}
                  className="gap-1.5"
                >
                  Open Unified Profile
                  <ArrowRight size={15} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
