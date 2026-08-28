'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Cell as PieCell
} from 'recharts'
import { ROUTES } from '@/lib/constants/routes'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api/client'
import { BarChart2 } from 'lucide-react'

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  
  useEffect(() => {
    setIsClient(true)
    apiFetch('/dashboard/summary').then(setSummary).catch(console.error)
  }, [])

  if (!isClient) return null // avoid hydration mismatch on recharts

  const distData = [
    { name: 'Research', score: summary?.categoryPerformance?.Research || 0 },
    { name: 'Teaching', score: summary?.categoryPerformance?.Teaching || 0 },
    { name: 'Mentoring', score: summary?.categoryPerformance?.Mentoring || 0 },
    { name: 'Service', score: summary?.categoryPerformance?.["Institutional Service"] || 0 },
    { name: 'Innovation', score: summary?.categoryPerformance?.Innovation || 0 },
  ]

  // Brand colours aligned with the existing design palette
  const CATEGORY_COLORS = ['#0F8B8D', '#4F6BED', '#D6A84F', '#7C3AED', '#D97706']

  // True when at least one category has a non-zero score
  const hasData = distData.some(d => d.score > 0)

  const qualityData = summary ? [
    { name: 'Complete', value: summary.evidenceCompleteness, color: 'var(--success)' },
    { name: 'Missing', value: 100 - summary.evidenceCompleteness, color: 'var(--border-default)' },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Platform Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Institutional academic profile analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Faculty', value: summary?.totalFaculty || 0, suffix: '' },
          { label: 'Avg. Assessment Score', value: summary?.averageAssessmentScore || 0, suffix: '' },
          { label: 'Avg. Completeness', value: summary?.evidenceCompleteness || 0, suffix: '%' },
          { label: 'Pending Conflicts', value: summary?.openConflicts || 0, suffix: '' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-xl border flex flex-col"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <span className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
            <div className="text-3xl font-bold flex items-baseline gap-1" style={{ color: 'var(--text-primary)' }}>
              <AnimatedCounter value={stat.value} duration={1000} format={(n) => stat.value % 1 !== 0 ? n.toFixed(1) : Math.round(n).toLocaleString('en-IN')} />
              <span className="text-lg">{stat.suffix}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Faculty Table */}
        <div className="lg:col-span-3 rounded-xl border overflow-hidden flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Faculty</h2>
            <Link href={ROUTES.faculty.list} className="text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }}>View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name & Dept</th>
                  <th className="px-4 py-3 font-medium text-center">Completeness</th>
                  <th className="px-4 py-3 font-medium text-center">Sources</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {summary?.recentFaculty?.map((fac: any) => (
                  <tr key={fac.id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{fac.canonical_name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{fac.department}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--text-primary)]">
                      {fac.completeness_score}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {/* Simplified source coverage since we don't return coverage obj */}
                        <div className="w-2 h-2 rounded-full bg-blue-500" title="Google Scholar" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={fac.onboarding_status === 'active' ? 'success' : fac.onboarding_status === 'pending' ? 'warning' : 'neutral'}>
                        {fac.onboarding_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={ROUTES.faculty.profile(fac.id)}
                        className="text-xs font-medium px-2 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column - Source Health */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border p-5 flex flex-col h-full" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Data Quality</h2>
            <div className="flex-1 flex items-center justify-center min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {qualityData.map((entry, index) => (
                      <PieCell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">Source Sync Health</h3>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-elevated)]">
                <span className="text-sm text-[var(--text-primary)]">Google Scholar</span>
                <Badge variant="success">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-elevated)]">
                <span className="text-sm text-[var(--text-primary)]">Institutional DB</span>
                <Badge variant="success">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-elevated)]">
                <span className="text-sm text-[var(--text-primary)]">ORCID API</span>
                <Badge variant="warning">Degraded</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
