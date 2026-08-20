'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, GraduationCap, Globe, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants/routes'
import { Badge } from '@/components/ui/Badge'

export default function NewFacultyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
    institution: '',
    empId: '',
    scholarId: '',
    researchgateSlug: '',
    orcidId: '',
  })

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const steps = [
    { num: 1, title: 'Basic Information' },
    { num: 2, title: 'Source Discovery' },
    { num: 3, title: 'Review & Confirm' },
    { num: 4, title: 'Done' }
  ]

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Add New Faculty</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Onboard a faculty member and configure their data sources.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[var(--border-subtle)] -z-10" />
        {steps.map((s, i) => {
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
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Full Name *</label>
                  <input 
                    type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="e.g. Dr. Jane Smith"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Email Address</label>
                  <input 
                    type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Department</label>
                  <select 
                    value={formData.department} onChange={e => updateForm('department', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Designation</label>
                  <select 
                    value={formData.designation} onChange={e => updateForm('designation', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Select Designation</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Institution</label>
                  <input 
                    type="text" value={formData.institution} onChange={e => updateForm('institution', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Employee ID</label>
                  <input 
                    type="text" value={formData.empId} onChange={e => updateForm('empId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={() => setStep(2)} disabled={!formData.name}>
                  Next Step <ChevronRight size={16} className="ml-1" />
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
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Extract the 12-character ID from the URL (e.g. user=XXXXXXXXXXXX)</p>
                  <input 
                    type="text" value={formData.scholarId} onChange={e => updateForm('scholarId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="e.g. J_4XXXXAAAAJ"
                  />
                </div>
              </div>

              <div className="p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex gap-4">
                <BookOpen className="text-green-400 shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                      ResearchGate Slug
                      <Badge variant="warning">Coming Soon</Badge>
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">The username part of the ResearchGate profile URL.</p>
                  <input 
                    type="text" value={formData.researchgateSlug} onChange={e => updateForm('researchgateSlug', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="e.g. John-Smith-10"
                  />
                </div>
              </div>

              <div className="p-5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex gap-4">
                <Globe className="text-purple-400 shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[var(--text-primary)]">ORCID ID (Optional)</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">The 16-digit ORCID identifier.</p>
                  <input 
                    type="text" value={formData.orcidId} onChange={e => updateForm('orcidId', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    placeholder="e.g. 0000-0002-1825-0097"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Review <ChevronRight size={16} className="ml-1" />
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
                <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  <h3 className="font-medium text-[var(--text-primary)]">Summary</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Full Name</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Email</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.email || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Department</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.department || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Designation</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.designation || '-'}</div>
                    </div>
                  </div>
                  
                  <hr className="border-[var(--border-subtle)]" />
                  
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">Google Scholar</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.scholarId || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-muted)]">ORCID</div>
                      <div className="text-sm text-[var(--text-primary)] font-medium">{formData.orcidId || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(4)}>Confirm & Create Faculty</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
                <Check size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Faculty Profile Created</h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                {formData.name}'s profile has been initialized. The system will now begin synchronizing data from the provided sources.
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" onClick={() => router.push(ROUTES.faculty.list)}>Go to Directory</Button>
                <Button variant="primary" onClick={() => router.push(ROUTES.faculty.profile('fac-1'))}>View Profile</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
