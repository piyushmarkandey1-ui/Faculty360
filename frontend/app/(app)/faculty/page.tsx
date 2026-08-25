'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Plus } from 'lucide-react'
import { ROUTES } from '@/lib/constants/routes'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/api/client'
import { formatRelativeTime } from '@/lib/utils/format'

export default function FacultyDirectoryPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [facultyList, setFacultyList] = useState<any[]>([])

  useEffect(() => {
    apiFetch('/faculty').then((res: any) => setFacultyList(res.items || [])).catch(console.error)
  }, [])

  const filteredFaculty = facultyList.filter(fac => {
    const matchesSearch = fac.canonical_name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || fac.onboarding_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Faculty Directory</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Showing {facultyList.length} indexed profiles
          </p>
        </div>
        <Link href={ROUTES.faculty.new}>
          <Button variant="primary" className="gap-2">
            <Plus size={16} />
            Add Faculty
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input 
            type="text" 
            placeholder="Search faculty by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:border-[var(--accent)] transition-colors"
            style={{ 
              background: 'var(--bg-surface)', 
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[var(--text-muted)] hidden sm:block" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border focus:outline-none focus:border-[var(--accent)]"
            style={{ 
              background: 'var(--bg-surface)', 
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-5 py-4 font-medium">Name & Dept</th>
                <th className="px-5 py-4 font-medium">Designation</th>
                <th className="px-5 py-4 font-medium min-w-[120px]">Completeness</th>
                <th className="px-5 py-4 font-medium text-center">Sources</th>
                <th className="px-5 py-4 font-medium">Last Synced</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredFaculty.map((fac) => (
                <tr key={fac.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[var(--text-primary)]">{fac.canonical_name}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{fac.department}</div>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-secondary)]">
                    {fac.designation}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${fac.completeness_score}%`,
                            background: fac.completeness_score > 80 ? 'var(--success)' : fac.completeness_score > 50 ? 'var(--warning)' : 'var(--danger)'
                          }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] font-medium w-8">
                        {fac.completeness_score}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-1.5">
                      {fac.source_coverage.google_scholar && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Google Scholar" />}
                      {fac.source_coverage.researchgate && <div className="w-2.5 h-2.5 rounded-full bg-green-500" title="ResearchGate" />}
                      {fac.source_coverage.institutional && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Institutional" />}
                      {fac.source_coverage.orcid && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" title="ORCID" />}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--text-secondary)] text-xs">
                    {fac.last_synced_at ? formatRelativeTime(fac.last_synced_at) : 'Never'}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={fac.onboarding_status === 'active' ? 'success' : fac.onboarding_status === 'pending' ? 'warning' : 'neutral'}>
                      {fac.onboarding_status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={ROUTES.faculty.profile(fac.id)}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredFaculty.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[var(--text-muted)]">
                    No faculty found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
