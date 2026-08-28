'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, Layers, Users, Loader2, Sparkles, Check, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function NewAssessmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  
  // Data
  const [frameworks, setFrameworks] = useState<any[]>([])
  const [loadingFrameworks, setLoadingFrameworks] = useState(true)
  const [selectedFramework, setSelectedFramework] = useState<any>(null)
  
  const [facultyList, setFacultyList] = useState<any[]>([])
  const [loadingFaculty, setLoadingFaculty] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null)
  
  const [assessing, setAssessing] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<any>(null)

  useEffect(() => {
    apiFetch('/assessment/frameworks').then((res: any) => {
      setFrameworks(res.items || [])
      if (res.items && res.items.length === 1) {
        setSelectedFramework(res.items[0])
      }
      setLoadingFrameworks(false)
    }).catch(err => {
      console.error(err)
      setLoadingFrameworks(false)
    })
  }, [])

  useEffect(() => {
    if (step === 3 && facultyList.length === 0) {
      setLoadingFaculty(true)
      apiFetch('/faculty').then((res: any) => {
        setFacultyList(res.items || [])
        setLoadingFaculty(false)
      }).catch(err => {
        console.error(err)
        setLoadingFaculty(false)
      })
    }
  }, [step, facultyList.length])

  const handleStartAssessment = async () => {
    if (!selectedFaculty || !selectedFramework) return
    setStep(4)
    setAssessing(true)
    
    // Simulate animation delay for UX
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const result = await apiFetch(`/faculty/${selectedFaculty}/assessment/calculate`, {
        method: 'POST',
        body: JSON.stringify({ framework_id: selectedFramework.id })
      })
      setAssessmentResult(result)
    } catch (err) {
      console.error(err)
      alert("Failed to calculate assessment")
    } finally {
      setAssessing(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
      {[
        { num: 1, label: 'Select Framework' },
        { num: 2, label: 'Review Config' },
        { num: 3, label: 'Select Faculty' },
        { num: 4, label: 'Run Assessment' }
      ].map((s) => (
        <div key={s.num} className="flex flex-col items-center gap-2 relative z-10 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            step > s.num ? 'bg-[var(--success)] text-white' : 
            step === s.num ? 'bg-[var(--accent)] text-white' : 
            'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
          }`}>
            {step > s.num ? <Check size={14} /> : s.num}
          </div>
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${step >= s.num ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="p-2 h-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">New Assessment Entry</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create deterministic KPI assessments using active frameworks.</p>
        </div>
      </div>

      {renderStepIndicator()}

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6 shadow-sm min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Layers size={18} className="text-[var(--accent)]" /> Select Assessment Framework</h2>
              {loadingFrameworks ? (
                <div className="flex items-center justify-center py-20 text-[var(--text-muted)]"><Loader2 className="animate-spin" /></div>
              ) : frameworks.length === 0 ? (
                <div className="text-center py-10 space-y-4 border border-dashed border-[var(--border-subtle)] rounded-lg">
                  <p className="text-[var(--text-secondary)]">No active assessment framework is available.</p>
                  <Link href="/settings"><Button variant="primary">Configure Framework</Button></Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {frameworks.map(fw => {
                    const catCount = fw.config?.categories?.length || 0
                    const weightTotal = fw.config?.categories?.reduce((acc: number, c: any) => acc + (c.weight || 0), 0) || 0
                    return (
                      <div 
                        key={fw.id} 
                        onClick={() => setSelectedFramework(fw)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedFramework?.id === fw.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)]'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-[var(--text-primary)]">{fw.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="neutral">Version {fw.version}</Badge>
                              <Badge variant="success">Active</Badge>
                            </div>
                          </div>
                          {selectedFramework?.id === fw.id && <CheckCircle2 className="text-[var(--accent)]" />}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-3">
                          {catCount} Categories &middot; {(weightTotal * 100).toFixed(0)}% Weight
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
                <Button variant="primary" disabled={!selectedFramework} onClick={() => setStep(2)}>
                  Review Framework <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && selectedFramework && (
            <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Layers size={18} className="text-[var(--accent)]" /> Framework Review</h2>
              <p className="text-sm text-[var(--text-secondary)]">This is a read-only confirmation of the framework rules that will be applied.</p>
              
              <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-5">
                <div className="mb-4 pb-4 border-b border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] text-lg">{selectedFramework.name}</h3>
                  <div className="text-sm text-[var(--text-muted)] mt-1">Version {selectedFramework.version}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">
                    <span>Category</span>
                    <span>Weight</span>
                  </div>
                  {selectedFramework.config?.categories?.map((cat: any) => (
                    <div key={cat.id} className="flex justify-between items-center bg-[var(--bg-surface)] p-3 rounded border border-[var(--border-subtle)]">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{cat.name}</span>
                      <Badge variant="neutral">{(cat.weight * 100).toFixed(0)}%</Badge>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 mt-4 border-t border-dashed border-[var(--border-subtle)]">
                    <span className="text-sm font-bold text-[var(--text-primary)]">Total</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {((selectedFramework.config?.categories?.reduce((acc: number, c: any) => acc + (c.weight || 0), 0) || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-[var(--border-subtle)]">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Select Faculty <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Users size={18} className="text-[var(--accent)]" /> Select Faculty Member</h2>
              
              {loadingFaculty ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>
              ) : (
                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {facultyList.map(fac => (
                    <div 
                      key={fac.id} 
                      onClick={() => setSelectedFaculty(fac.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedFaculty === fac.id ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)]'}`}
                    >
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{fac.canonical_name}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">{fac.department} &middot; {fac.designation}</div>
                      </div>
                      {selectedFaculty === fac.id ? <CheckCircle2 className="text-[var(--accent)]" /> : <div className="w-5 h-5 rounded-full border border-[var(--border-subtle)]" />}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between pt-4 border-t border-[var(--border-subtle)]">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button variant="primary" disabled={!selectedFaculty} onClick={handleStartAssessment} className="bg-[var(--success)] hover:bg-[var(--success)] text-white border-transparent">
                  <Sparkles size={16} className="mr-2" /> Start Assessment
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="flex flex-col items-center justify-center py-10 space-y-8">
              {assessing ? (
                <div className="text-center space-y-4">
                  <Loader2 size={48} className="animate-spin text-[var(--accent)] mx-auto" />
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Executing Framework Engine...</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Applying rules from {selectedFramework?.name} (v{selectedFramework?.version})</p>
                </div>
              ) : assessmentResult ? (
                <div className="text-center space-y-6 w-full max-w-md">
                  <div className="w-20 h-20 bg-[var(--success)]/20 text-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">Assessment Complete</h3>
                    <p className="text-[var(--text-secondary)] mt-2">Saved with Framework {selectedFramework?.version}</p>
                  </div>
                  
                  <div className="bg-[var(--bg-base)] p-6 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Score</div>
                      <div className="text-3xl font-bold text-[var(--accent)]">{assessmentResult.total_score}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Confidence</div>
                      <div className="text-xl font-semibold text-[var(--text-primary)]">{assessmentResult.confidence_score}%</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 w-full">
                    <Link href={`/faculty/${selectedFaculty}/assessment`} className="flex-1">
                      <Button variant="secondary" className="w-full">View Details</Button>
                    </Link>
                    <Link href="/assessments" className="flex-1">
                      <Button variant="primary" className="w-full">Done</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-[var(--danger)]">Failed to generate assessment.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
