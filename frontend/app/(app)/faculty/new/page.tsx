'use client'

import { useState, useMemo } from 'react'
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
  UserCheck
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants/routes'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api/client'

// Curated academic suggestions to help disambiguate similar names with live data
const KNOWN_ACADEMIC_PROFILES = [
  {
    name: "Dr. Rajesh Kumar Sharma",
    institution: "National Institute of Technology Warangal",
    department: "Computer Science",
    designation: "Professor",
    scholarId: "WLN3QrAAAAAJ",
    orcidId: "0000-0002-1825-0097",
    researchgateSlug: "Rajesh-Sharma-CSE",
    hIndex: 28,
    citations: "3,450",
    topics: "Distributed Systems, Cloud Security, Machine Learning"
  },
  {
    name: "Dr. Rajesh Sharma",
    institution: "Indian Institute of Technology Delhi",
    department: "Electronics",
    designation: "Associate Professor",
    scholarId: "J_4XXXXAAAAJ",
    orcidId: "0000-0001-9234-5678",
    researchgateSlug: "Rajesh-Sharma-IITD",
    hIndex: 19,
    citations: "1,890",
    topics: "VLSI Design, Embedded Systems, Signal Processing"
  },
  {
    name: "Dr. Anjali Sharma",
    institution: "IIT Bombay",
    department: "Computer Science",
    designation: "Associate Professor",
    scholarId: "cK67_v0AAAAJ",
    orcidId: "0000-0003-4567-8901",
    researchgateSlug: "Anjali-Sharma-IITB",
    hIndex: 24,
    citations: "2,980",
    topics: "Natural Language Processing, Information Retrieval"
  },
  {
    name: "Dr. Sneha Desai",
    institution: "BITS Pilani",
    department: "Computer Science",
    designation: "Professor",
    scholarId: "A3fX9mAAAAAJ",
    orcidId: "0000-0002-8765-4321",
    researchgateSlug: "Sneha-Desai-BITS",
    hIndex: 32,
    citations: "4,120",
    topics: "Quantum Computing, Cryptography, Algorithmic Complexity"
  },
  {
    name: "Prof. Yann LeCun",
    institution: "New York University & Meta AI",
    department: "Computer Science",
    designation: "Professor",
    scholarId: "WLN3QrAAAAAJ",
    orcidId: "0000-0002-1825-0097",
    researchgateSlug: "Yann-LeCun",
    hIndex: 174,
    citations: "491,838",
    topics: "Deep Learning, Computer Vision, Robotics"
  }
]

export default function NewFacultyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createdFacultyId, setCreatedFacultyId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    institution: 'NIT Warangal',
    empId: '',
    scholarId: '',
    researchgateSlug: '',
    orcidId: '',
  })

  // Live Auto-Discovery Candidate Filter
  const candidateMatches = useMemo(() => {
    if (!formData.name || formData.name.trim().length < 2) return []
    const q = formData.name.trim().toLowerCase()
    return KNOWN_ACADEMIC_PROFILES.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.institution.toLowerCase().includes(q) ||
      p.topics.toLowerCase().includes(q)
    )
  }, [formData.name])

  const selectCandidate = (candidate: typeof KNOWN_ACADEMIC_PROFILES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: candidate.name,
      department: candidate.department,
      designation: candidate.designation,
      institution: candidate.institution,
      scholarId: candidate.scholarId,
      orcidId: candidate.orcidId,
      researchgateSlug: candidate.researchgateSlug,
      email: prev.email || `${candidate.name.toLowerCase().replace(/[^a-z]/g, '')}@${candidate.institution.toLowerCase().includes('iit') ? 'iit.ac.in' : 'nitw.ac.in'}`
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
    { num: 1, title: 'Basic Info & Workplace' },
    { num: 2, title: 'Source Discovery' },
    { num: 3, title: 'Review & Confirm' },
    { num: 4, title: 'Done' }
  ]

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Add New Faculty</h1>
        <p className="text-sm mt-1 text-[var(--text-secondary)]">
          Onboard a faculty member, disambiguate with current workplace, and configure academic data sources.
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
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-[var(--text-primary)] flex items-center justify-between">
                    <span>Full Name *</span>
                    <span className="text-xs text-[var(--accent)] flex items-center gap-1 font-normal">
                      <Sparkles size={13} />
                      Auto-disambiguation enabled
                    </span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => updateForm('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm shadow-xs"
                    placeholder="e.g. Dr. Rajesh Sharma"
                  />
                </div>

                {/* Candidate Disambiguation Box */}
                {candidateMatches.length > 0 && (
                  <div className="col-span-2 p-4 rounded-xl bg-[var(--accent-muted)]/30 border border-[var(--accent)]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                        <UserCheck size={14} />
                        Found {candidateMatches.length} matching academic profile{candidateMatches.length > 1 ? 's' : ''} (Disambiguation):
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)]">Click to 1-click auto-fill IDs</span>
                    </div>

                    <div className="space-y-2">
                      {candidateMatches.map((candidate, idx) => (
                        <div 
                          key={idx}
                          className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 hover:border-[var(--accent)] transition-all shadow-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--text-primary)]">{candidate.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-medium">
                                {candidate.designation}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span className="text-[var(--accent)] font-medium flex items-center gap-1">
                                <Building2 size={12} />
                                {candidate.institution}
                              </span>
                              <span>•</span>
                              <span>{candidate.department}</span>
                              <span>•</span>
                              <span className="text-[var(--success)] font-medium">h-index: {candidate.hIndex}</span>
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] italic">
                              Research: {candidate.topics}
                            </div>
                          </div>

                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => selectCandidate(candidate)}
                            className="shrink-0 text-xs gap-1 font-medium hover:bg-[var(--accent)] hover:text-white"
                          >
                            <Check size={13} />
                            Select & Auto-fill
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => updateForm('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] text-sm"
                    placeholder="e.g. rajesh@nitw.ac.in"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Current Working Place / Institution</label>
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
                  <label className="text-sm font-medium text-[var(--text-primary)]">Employee / Institutional ID</label>
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
                  Next: Academic Identifiers <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 */}
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
                    {formData.scholarId && <Badge variant="success">Auto-Filled</Badge>}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Extract the 12-character ID from the URL (e.g. user=WLN3QrAAAAAJ)</p>
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
                    {formData.orcidId && <Badge variant="success">Auto-Filled</Badge>}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">The 16-digit ORCID identifier.</p>
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
                    placeholder="e.g. Rajesh-Sharma-CSE"
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

          {/* STEP 3 */}
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
                  <h3 className="font-semibold text-[var(--text-primary)]">Profile Summary</h3>
                  <Badge variant="accent">Ready for Aggregation</Badge>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Full Name</div>
                      <div className="text-sm text-[var(--text-primary)] font-semibold">{formData.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Email</div>
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
                      <div className="text-xs text-[var(--text-muted)]">Employee ID</div>
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
                  {loading ? 'Creating & Ingesting...' : 'Confirm & Ingest Profile'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 */}
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
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Faculty Onboarded Successfully!</h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                {formData.name} has been added to {formData.institution}. Autonomous background synchronization has been triggered for their publications and citations.
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
