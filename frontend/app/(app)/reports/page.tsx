'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { API_BASE_URL } from '@/lib/constants/config'

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadFacultyReport = () => {
    setDownloading(true)
    const url = `${API_BASE_URL}/reports/faculty`
    window.open(url, '_blank')
    setTimeout(() => setDownloading(false), 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Institutional Reports</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Export assessment and performance data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl border flex flex-col justify-between h-48"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <FileText className="mb-3" style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Faculty Assessment Report</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>CSV export of all faculty members with their completeness and latest approved assessment score.</p>
          </div>
          <Button variant="secondary" onClick={handleDownloadFacultyReport} disabled={downloading} className="w-full gap-2 mt-4">
            <Download size={16} />
            Export CSV
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
