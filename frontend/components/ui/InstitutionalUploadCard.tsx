'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'

type UploadStatus = 'idle' | 'validating' | 'processing' | 'success' | 'error'

interface ImportSummary {
  recordsReceived: number
  recordsImported: number
  recordsUpdated: number
  unmatchedFaculty: number
  invalidRecords: number
  duplicatesDetected: number
}

export function InstitutionalUploadCard() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setStatus('idle')
      setErrorMsg(null)
      setSummary(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setStatus('validating')
    setErrorMsg(null)
    setSummary(null)
    
    // Check file extension client-side
    if (!selectedFile.name.endsWith('.csv')) {
      setStatus('error')
      setErrorMsg('Only CSV files are supported')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      setStatus('processing')
      
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
      setStatus('success')
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
            <p className="text-xs text-[var(--text-secondary)]">CSV upload for Teaching, Mentoring, Projects, Awards</p>
          </div>
        </div>
        <Badge variant={status === 'success' ? 'success' : status === 'error' ? 'danger' : 'neutral'}>
          {status === 'idle' ? 'Ready' : status === 'validating' ? 'Validating...' : status === 'processing' ? 'Processing...' : status === 'success' ? 'Imported' : 'Failed'}
        </Badge>
      </div>

      {!summary && (
        <div className="mt-2 space-y-4">
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
              variant="primary"
              size="sm"
              onClick={handleUpload}
              disabled={!selectedFile || status === 'processing' || status === 'validating'}
              className="gap-2"
            >
              {(status === 'processing' || status === 'validating') ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {status === 'validating' ? 'Validating...' : status === 'processing' ? 'Importing...' : 'Upload CSV'}
            </Button>
          </div>
        </div>
      )}

      {summary && status === 'success' && (
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
              <div className="text-xs text-[var(--warning)] mb-1">Unmatched Faculty</div>
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
