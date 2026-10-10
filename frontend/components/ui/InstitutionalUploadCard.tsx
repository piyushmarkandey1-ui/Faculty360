'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Download, Sparkles, Database } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'

type UploadStatus = 'idle' | 'validating' | 'preview' | 'processing' | 'success' | 'error'

interface ImportSummary {
  recordsReceived: number
  recordsImported: number
  recordsUpdated: number
  unmatchedFaculty: number
  invalidRecords: number
  duplicatesDetected: number
  previewData?: any[]
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories (Multi-Category CSV)' },
  { value: 'teaching', label: 'Teaching & Course Instruction' },
  { value: 'mentoring', label: 'Research Scholars & Mentoring' },
  { value: 'service', label: 'Institutional Service & Governance' },
  { value: 'projects', label: 'Sponsored Projects & Grants' },
  { value: 'innovation', label: 'Patents & Intellectual Property' },
  { value: 'outreach', label: 'Outreach, Keynotes & Workshops' },
  { value: 'awards', label: 'Awards, Medals & Honors' },
  { value: 'career', label: 'Career History & Appointments' }
]

const SAMPLE_CSV_PRESETS: Record<string, string> = {
  all: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-2805,govardhan.bhatt@nitrr.ac.in,teaching,Advanced Structural Dynamics & Earthquake Engineering,Undergraduate Core Course for Semester VI,2026,48,4.85
FAC-6053,dilip.sisodia@nitrr.ac.in,teaching,Machine Learning and Pattern Recognition,Core CS undergraduate course covering supervised/unsupervised learning,2026,52,4.92
FAC-2805,govardhan.bhatt@nitrr.ac.in,mentoring,Rahul Sharma - Doctoral Dissertation,Seismic Fragility Modeling and Retrofitting of Heritage RC Frames,2026,120,4.90
FAC-6053,dilip.sisodia@nitrr.ac.in,service,Head of Department & Academic Senate Member,Steered curriculum modernization aligned with NEP-2020,2026,85,5.00
FAC-2805,govardhan.bhatt@nitrr.ac.in,projects,Real-time Vibration Monitoring of High-Rise Structures,DST-SERB Core Research Grant (INR 48.5 Lakhs),2026,300,4.95
FAC-6053,dilip.sisodia@nitrr.ac.in,innovation,Multi-Modal Attention Neural Network for Early Sepsis Detection,Indian Patent Grant No. 492015,2026,0,5.00
FAC-1976,sewan.patle@nitrr.ac.in,outreach,Workshop Chair: Hands-on Cloud Native Microservices,AICTE ATAL Faculty Development Program,2026,16,4.85
FAC-6053,dilip.sisodia@nitrr.ac.in,awards,Best Researcher of the Year Award 2026,Awarded by Institutional Senate for high-impact research,2026,0,5.00`,

  teaching: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-2805,govardhan.bhatt@nitrr.ac.in,teaching,Advanced Structural Dynamics & Earthquake Engineering,Undergraduate Core Course for Semester VI,2026,48,4.85
FAC-6053,dilip.sisodia@nitrr.ac.in,teaching,Machine Learning and Pattern Recognition,Core CS undergraduate course with capstone projects,2026,52,4.92
FAC-1976,sewan.patle@nitrr.ac.in,teaching,Distributed Systems and Cloud Architecture,Postgraduate core curriculum on consensus & microservices,2026,45,4.78
FAC-76C3A1,andrew.ng@academic.edu,teaching,Deep Learning Foundations and Multi-Agent AI Systems,Comprehensive lecture course covering transformer architectures,2026,60,5.00`,

  mentoring: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-2805,govardhan.bhatt@nitrr.ac.in,mentoring,Rahul Sharma - Doctoral Dissertation,Seismic Fragility Modeling of Heritage RC Frames,2026,120,4.90
FAC-6053,dilip.sisodia@nitrr.ac.in,mentoring,Amit Verma - Ph.D. Scholar,Deep Semantic Feature Representations in Biomedical Imagery,2026,160,5.00
FAC-1976,sewan.patle@nitrr.ac.in,mentoring,Pooja Verma - M.Tech Thesis,Edge AI Consensus Algorithms for IoT Deployments,2026,80,4.80`,

  service: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-2805,govardhan.bhatt@nitrr.ac.in,service,Chairman - Institute Accreditation & NBA Committee,Led Tier-I NBA accreditation renewal,2026,60,4.90
FAC-6053,dilip.sisodia@nitrr.ac.in,service,Head of Department & Academic Senate Member,Steered curriculum modernization aligned with NEP-2020,2026,85,5.00
FAC-1976,sewan.patle@nitrr.ac.in,service,Faculty Advisor - Student Innovation & Hackathon Cell,Organized National Smart India Hackathon internal rounds,2026,40,4.85`,

  projects: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-2805,govardhan.bhatt@nitrr.ac.in,projects,Real-time Vibration Monitoring of High-Rise Structures,DST-SERB Core Research Grant (INR 48.5 Lakhs),2026,300,4.95
FAC-6053,dilip.sisodia@nitrr.ac.in,projects,Federated Learning for Privacy-Preserving Healthcare,MeitY Government of India R&D Grant (INR 62.0 Lakhs),2026,450,5.00
FAC-1976,sewan.patle@nitrr.ac.in,projects,Decentralized Edge Intelligence for Smart Agriculture,AICTE Research Promotion Scheme (INR 25.0 Lakhs),2026,250,4.80`,

  innovation: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-2805,govardhan.bhatt@nitrr.ac.in,innovation,Tunable Liquid Column Mass Damper for Wind & Seismic Attenuation,Indian Patent Application No. 202621045812 (Published),2026,0,5.00
FAC-6053,dilip.sisodia@nitrr.ac.in,innovation,Multi-Modal Attention Neural Network for Early Sepsis Detection,Indian Patent Grant No. 492015,2026,0,5.00
FAC-1976,sewan.patle@nitrr.ac.in,innovation,Adaptive Resource Allocation Framework in Heterogeneous Edge Nodes,Copyright Registration No. SW-18492/2026,2026,0,4.90`,

  outreach: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-2805,govardhan.bhatt@nitrr.ac.in,outreach,Keynote Address: Resilient Smart Infrastructure in Seismic Zones,15th International Conference on Structural Engineering,2026,8,5.00
FAC-6053,dilip.sisodia@nitrr.ac.in,outreach,Distinguished Speaker: Trustworthy AI and Algorithmic Fairness,IEEE International Computer Society Conclave 2026,2026,10,5.00
FAC-1976,sewan.patle@nitrr.ac.in,outreach,Workshop Chair: Hands-on Cloud Native Microservices,AICTE ATAL Faculty Development Program,2026,16,4.85`,

  awards: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-6053,dilip.sisodia@nitrr.ac.in,awards,Best Researcher of the Year Award 2026,Awarded by Institutional Senate for high-impact research,2026,0,5.00
FAC-2805,govardhan.bhatt@nitrr.ac.in,awards,National Structural Engineering Excellence Medal,Indian Concrete Institute & ASCE India Section,2025,0,5.00`,

  career: `employee_id,email,category,title,description,year,hours,feedback_score
FAC-6053,dilip.sisodia@nitrr.ac.in,career,Professor & HoD (Computer Science & Engineering),National Institute of Technology Raipur,2026,0,5.00
FAC-2805,govardhan.bhatt@nitrr.ac.in,career,Associate Professor (Civil Engineering),National Institute of Technology Raipur,2026,0,5.00`
}

export function InstitutionalUploadCard() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('teaching')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setStatus('idle')
      setErrorMsg(null)
      setSummary(null)
    }
  }

  const handleLoadSampleData = () => {
    const csvContent = SAMPLE_CSV_PRESETS[selectedCategory] || SAMPLE_CSV_PRESETS.teaching
    const fileName = selectedCategory === 'all' ? 'synthetic_institutional_records.csv' : `synthetic_${selectedCategory}.csv`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const sampleFile = new File([blob], fileName, { type: 'text/csv' })
    
    setSelectedFile(sampleFile)
    setStatus('idle')
    setErrorMsg(null)
    setSummary(null)
  }

  const handleDownloadTemplate = () => {
    const csvContent = SAMPLE_CSV_PRESETS[selectedCategory] || SAMPLE_CSV_PRESETS.teaching
    const fileName = selectedCategory === 'all' ? 'synthetic_institutional_records.csv' : `synthetic_${selectedCategory}.csv`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUpload = async (dryRun: boolean) => {
    if (!selectedFile) return
    setStatus(dryRun ? 'validating' : 'processing')
    setErrorMsg(null)
    
    if (!selectedFile.name.endsWith('.csv')) {
      setStatus('error')
      setErrorMsg('Only CSV files are supported')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (selectedCategory && selectedCategory !== 'all') {
        formData.append('category', selectedCategory)
      }
      formData.append('dry_run', dryRun ? 'true' : 'false')

      const rawBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '')
      const uploadUrl = rawBase ? `${rawBase}/api/institutional/upload` : '/api/institutional/upload'

      const { getAuthToken } = await import('@/lib/api/client')
      const token = await getAuthToken()
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }))
        throw new Error(errorData.detail || 'Upload failed')
      }

      const data = await res.json()
      setSummary(data)
      setStatus(dryRun ? 'preview' : 'success')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during upload')
      setStatus('error')
    }
  }

  return (
    <div className="p-5 rounded-xl border flex flex-col bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--bg-base)] text-[var(--accent)]">
            <Upload size={16} />
          </div>
          <div>
            <h3 className="font-medium text-sm text-[var(--text-primary)]">Batch Data Import</h3>
            <p className="text-xs text-[var(--text-secondary)]">CSV upload & synthetic ingestion for institutional records</p>
          </div>
        </div>
        <Badge variant={status === 'success' ? 'success' : status === 'error' ? 'danger' : 'neutral'}>
          {status === 'idle' ? 'Ready' : status === 'validating' ? 'Validating...' : status === 'preview' ? 'Preview' : status === 'processing' ? 'Processing...' : status === 'success' ? 'Imported' : 'Failed'}
        </Badge>
      </div>

      {(status === 'idle' || status === 'validating' || status === 'error' || status === 'processing') && (
        <div className="mt-2 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Data Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSummary(null)
              }}
              className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={status === 'processing' || status === 'validating'}
                className="block w-full text-sm text-[var(--text-secondary)]
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-xs file:font-semibold
                  file:bg-[var(--accent)] file:text-white
                  hover:file:bg-[var(--accent-hover)]
                  file:cursor-pointer file:transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            
            {selectedFile && (
              <div className="text-[11px] text-[var(--accent)] flex items-center gap-1.5 font-medium">
                <FileText size={12} /> Ready: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Synthetic Data Helpers */}
          <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Sparkles size={13} className="text-amber-500" />
              <span>Synthetic test dataset ready</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="text-xs px-2.5 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors font-medium flex items-center gap-1"
                title="Populate synthetic sample CSV data directly"
              >
                <Database size={11} /> Load Sample
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                title="Download CSV template"
              >
                <Download size={11} /> Template
              </button>
            </div>
          </div>
          
          {errorMsg && (
            <div className="flex gap-2 text-xs text-[var(--danger)] p-3 rounded-lg bg-[var(--danger-muted)]">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUpload(true)}
              disabled={!selectedFile || status === 'processing' || status === 'validating'}
              className="gap-2"
            >
              {(status === 'processing' || status === 'validating') ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              {status === 'validating' ? 'Validating...' : 'Validate & Preview'}
            </Button>
          </div>
        </div>
      )}

      {status === 'preview' && summary && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] font-medium bg-[var(--warning-muted)] p-2.5 rounded-lg text-[var(--warning)] border border-[var(--warning)] border-opacity-20">
            <AlertTriangle size={16} /> Preview Mode: Validation passed ({summary.recordsReceived} records). Review before persisting.
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Total Rows</div>
              <div className="text-base font-bold text-[var(--text-primary)]">{summary.recordsReceived}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--success)]">New To Add</div>
              <div className="text-base font-bold text-[var(--success)]">{summary.recordsImported}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--warning)]">Deduplicated</div>
              <div className="text-base font-bold text-[var(--warning)]">{summary.duplicatesDetected}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Unmatched</div>
              <div className="text-base font-bold text-[var(--text-muted)]">{summary.unmatchedFaculty}</div>
            </div>
          </div>
          
          {summary.previewData && summary.previewData.length > 0 && (
            <div className="mt-2 text-xs max-h-56 overflow-y-auto border border-[var(--border-subtle)] rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-base)] sticky top-0 text-[var(--text-muted)] font-medium">
                  <tr>
                    <th className="p-2.5 border-b border-[var(--border-subtle)]">Faculty</th>
                    <th className="p-2.5 border-b border-[var(--border-subtle)]">Category</th>
                    <th className="p-2.5 border-b border-[var(--border-subtle)]">Title / Activity</th>
                    <th className="p-2.5 border-b border-[var(--border-subtle)]">Year</th>
                    <th className="p-2.5 border-b border-[var(--border-subtle)] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-primary)] divide-y divide-[var(--border-subtle)]">
                  {summary.previewData.map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-base)]/50 transition-colors">
                      <td className="p-2.5 font-medium truncate max-w-[140px] text-[var(--text-primary)]">
                        {row.faculty_name || row.employee_id || row.email}
                      </td>
                      <td className="p-2.5 uppercase text-[10px] font-semibold text-[var(--accent)] tracking-wider">
                        {row.category}
                      </td>
                      <td className="p-2.5 truncate max-w-[200px]" title={row.title}>
                        {row.title}
                      </td>
                      <td className="p-2.5 text-[var(--text-muted)] font-mono">{row.year}</td>
                      <td className="p-2.5 text-right">
                        {row.is_duplicate ? (
                          <Badge variant="warning" size="sm">Update</Badge>
                        ) : (
                          <Badge variant="success" size="sm">New</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStatus('idle')}>
              Back / Re-select
            </Button>
            <Button variant="primary" size="sm" onClick={() => handleUpload(false)} className="gap-2">
              <Upload size={14} /> Confirm & Persist Records
            </Button>
          </div>
        </div>
      )}

      {status === 'success' && summary && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center gap-2 text-sm text-[var(--success)] font-semibold">
            <CheckCircle2 size={17} /> Ingestion & Synchronization Successful!
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Records have been successfully saved into Tiger Data. Faculty profiles, accreditation portfolios, and KPI metrics have been updated.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-0.5">Processed</div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{summary.recordsReceived}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--success)] mb-0.5">Newly Added</div>
              <div className="text-xl font-bold text-[var(--success)]">{summary.recordsImported}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--warning)] mb-0.5">Updated / Reconciled</div>
              <div className="text-xl font-bold text-[var(--warning)]">{summary.recordsUpdated}</div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setSummary(null); setSelectedFile(null); setStatus('idle'); }}>
              Upload Another Batch
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
