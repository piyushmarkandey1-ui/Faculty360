'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
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
  { value: 'teaching', label: 'Teaching' },
  { value: 'mentoring', label: 'Mentoring' },
  { value: 'service', label: 'Institutional Service' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'leadership', label: 'Academic Leadership' },
  { value: 'awards', label: 'Awards' },
  { value: 'projects', label: 'Projects' }
]

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
      formData.append('category', selectedCategory)
      formData.append('dry_run', dryRun ? 'true' : 'false')

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch(`${baseUrl}/api/institutional/upload`, {
        method: 'POST',
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
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
            <p className="text-xs text-[var(--text-secondary)]">CSV upload for institutional records</p>
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
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

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
          
          {errorMsg && (
            <div className="flex gap-2 text-xs text-[var(--danger)] p-3 rounded-lg bg-[var(--danger-muted)]">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
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
          <div className="flex items-center gap-2 text-sm text-[var(--text-primary)] font-medium bg-[var(--warning-muted)] p-2 rounded text-[var(--warning)] border border-[var(--warning)] border-opacity-20">
            <AlertTriangle size={16} /> Preview Mode: No data imported yet.
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">Valid rows</div>
              <div className="text-sm font-semibold">{summary.recordsReceived - summary.invalidRecords}</div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">New records</div>
              <div className="text-sm font-semibold">{summary.recordsImported}</div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-[10px] text-[var(--text-muted)]">Duplicates/Updates</div>
              <div className="text-sm font-semibold">{summary.duplicatesDetected}</div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--danger-muted)]">
              <div className="text-[10px] text-[var(--danger)]">Unmatched</div>
              <div className="text-sm font-semibold text-[var(--danger)]">{summary.unmatchedFaculty}</div>
            </div>
          </div>
          
          {summary.previewData && summary.previewData.length > 0 && (
            <div className="mt-2 text-xs overflow-x-auto border border-[var(--border-subtle)] rounded">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-base)] text-[var(--text-muted)]">
                  <tr>
                    <th className="p-2 border-b border-[var(--border-subtle)]">Title</th>
                    <th className="p-2 border-b border-[var(--border-subtle)]">Year</th>
                    <th className="p-2 border-b border-[var(--border-subtle)]">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-primary)]">
                  {summary.previewData.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 border-b border-[var(--border-subtle)] truncate max-w-[150px]">{row.title}</td>
                      <td className="p-2 border-b border-[var(--border-subtle)]">{row.year}</td>
                      <td className="p-2 border-b border-[var(--border-subtle)]">
                        {row.is_duplicate ? <Badge variant="warning" size="sm">Update</Badge> : <Badge variant="success" size="sm">New</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStatus('idle')}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => handleUpload(false)} className="gap-2">
              <Upload size={14} /> Confirm Import
            </Button>
          </div>
        </div>
      )}

      {status === 'success' && summary && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center gap-2 text-sm text-[var(--success)] font-medium">
            <CheckCircle2 size={16} /> Import Successful
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-muted)] mb-1">Received</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{summary.recordsReceived}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-muted)] mb-1">Imported New</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{summary.recordsImported}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-muted)] mb-1">Updated</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{summary.recordsUpdated}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--warning-muted)]">
              <div className="text-xs text-[var(--warning)] mb-1">Unmatched</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{summary.unmatchedFaculty}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--danger-muted)]">
              <div className="text-xs text-[var(--danger)] mb-1">Invalid</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{summary.invalidRecords}</div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => { setSummary(null); setSelectedFile(null); setStatus('idle'); }}>
              Upload Another
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
