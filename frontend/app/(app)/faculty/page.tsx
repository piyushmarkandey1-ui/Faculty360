'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Plus, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  X, 
  ArrowUpDown, 
  ExternalLink,
  BookOpen,
  GraduationCap,
  Building2,
  Mail,
  Award,
  FileCheck,
  Eye,
  Check,
  Sparkles,
  ArrowRight,
  Trash2,
  Loader2
} from 'lucide-react'
import { ROUTES } from '@/lib/constants/routes'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/api/client'
import { formatRelativeTime } from '@/lib/utils/format'

export default function FacultyDirectoryPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'completeness' | 'name' | 'recent'>('completeness')
  const [facultyList, setFacultyList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewFaculty, setPreviewFaculty] = useState<any | null>(null)
  const [facultyToDelete, setFacultyToDelete] = useState<any | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!facultyToDelete) return
    setDeleting(true)
    try {
      await apiFetch(`/faculty/${facultyToDelete.id}`, { method: 'DELETE' })
      setFacultyList(prev => prev.filter(f => f.id !== facultyToDelete.id))
      if (previewFaculty?.id === facultyToDelete.id) {
        setPreviewFaculty(null)
      }
      setFacultyToDelete(null)
    } catch (err) {
      console.error('Failed to delete faculty profile:', err)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    async function loadFaculty() {
      try {
        setLoading(true)
        const res: any = await apiFetch('/faculty')
        if (res && res.items) {
          setFacultyList(res.items)
        } else {
          setFacultyList([])
        }
      } catch (err) {
        console.error('Failed to load faculty directory:', err)
        setFacultyList([])
      } finally {
        setLoading(false)
      }
    }
    loadFaculty()
  }, [])

  // Extract unique departments dynamically
  const departments = useMemo(() => {
    const depts = new Set<string>()
    facultyList.forEach(fac => {
      if (fac.department) depts.add(fac.department)
    })
    return ['All', ...Array.from(depts)]
  }, [facultyList])

  // Fast, multi-field search and filter
  const filteredFaculty = useMemo(() => {
    const q = search.trim().toLowerCase()
    return facultyList
      .filter(fac => {
        const nameMatch = (fac.canonical_name || fac.display_name || '').toLowerCase().includes(q)
        const deptMatch = (fac.department || '').toLowerCase().includes(q)
        const desigMatch = (fac.designation || '').toLowerCase().includes(q)
        const idMatch = (fac.employee_id || fac.id || '').toLowerCase().includes(q)
        const emailMatch = (fac.canonical_email || '').toLowerCase().includes(q)
        const instMatch = (fac.institution || 'National Institute of Technology').toLowerCase().includes(q)

        const matchesSearch = !q || nameMatch || deptMatch || desigMatch || idMatch || emailMatch || instMatch
        const matchesStatus = statusFilter === 'All' || fac.onboarding_status === statusFilter
        const matchesDept = departmentFilter === 'All' || fac.department === departmentFilter

        return matchesSearch && matchesStatus && matchesDept
      })
      .sort((a, b) => {
        if (sortBy === 'completeness') {
          return (b.completeness_score || 0) - (a.completeness_score || 0)
        }
        if (sortBy === 'name') {
          return (a.canonical_name || '').localeCompare(b.canonical_name || '')
        }
        if (sortBy === 'recent') {
          return new Date(b.last_synced_at || 0).getTime() - new Date(a.last_synced_at || 0).getTime()
        }
        return 0
      })
  }, [facultyList, search, statusFilter, departmentFilter, sortBy])

  // Quick stats
  const stats = useMemo(() => {
    const total = facultyList.length
    const active = facultyList.filter(f => f.onboarding_status === 'active').length
    const avgCompleteness = total > 0 
      ? Math.round(facultyList.reduce((acc, f) => acc + (f.completeness_score || 0), 0) / total)
      : 0
    const totalConflicts = facultyList.reduce((acc, f) => acc + (f.conflict_count || 0), 0)
    return { total, active, avgCompleteness, totalConflicts }
  }, [facultyList])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Faculty Directory</h1>
          <p className="text-sm mt-1 text-[var(--text-secondary)]">
            Verified academic profiles with instant disambiguation, workplace previews, and multi-source traceability
          </p>
        </div>
        <Link href={ROUTES.faculty.new}>
          <Button variant="primary" className="gap-2 shadow-sm">
            <Plus size={16} />
            Add Faculty
          </Button>
        </Link>
      </div>

      {/* KPI Overview Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Total Faculty</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{stats.total}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--success-muted)] text-[var(--success)] flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Active Profiles</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{stats.active}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Avg Completeness</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{stats.avgCompleteness}%</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--warning-muted)] text-[var(--warning)] flex items-center justify-center font-bold">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Open Conflicts</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{stats.totalConflicts}</div>
          </div>
        </div>
      </div>

      {/* Instant Search & Multi-Filters Toolbar */}
      <div className="p-4 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-subtle)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Fast Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Search by professor name, workplace, department, designation, or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg border focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
              style={{ 
                background: 'var(--bg-elevated)', 
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-56">
            <select 
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[var(--accent)] text-sm"
              style={{ 
                background: 'var(--bg-elevated)', 
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[var(--accent)] text-sm"
              style={{ 
                background: 'var(--bg-elevated)', 
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

          {/* Sort By Dropdown */}
          <div className="w-full md:w-44">
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[var(--accent)] text-sm"
              style={{ 
                background: 'var(--bg-elevated)', 
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="completeness">Completeness (High)</option>
              <option value="name">Name (A → Z)</option>
              <option value="recent">Recently Synced</option>
            </select>
          </div>
        </div>

        {/* Live Filter Counter & Disambiguation Helper */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
          <span className="flex items-center gap-1.5">
            <span>Showing <strong className="text-[var(--text-primary)]">{filteredFaculty.length}</strong> of {facultyList.length} faculty</span>
            {search && (
              <span className="text-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 rounded text-[11px] font-medium">
                Filtered by &quot;{search}&quot;
              </span>
            )}
          </span>
          {(search || statusFilter !== 'All' || departmentFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('All')
                setDepartmentFilter('All')
              }}
              className="text-[var(--accent)] hover:underline font-medium"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-xl border overflow-hidden shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Professor & Workplace</th>
                <th className="px-5 py-3.5 font-semibold">Designation</th>
                <th className="px-5 py-3.5 font-semibold min-w-[130px]">Completeness</th>
                <th className="px-5 py-3.5 font-semibold text-center">Connected Sources</th>
                <th className="px-5 py-3.5 font-semibold">Last Synced</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              <AnimatePresence mode="popLayout">
                {filteredFaculty.map((fac) => (
                  <motion.tr 
                    key={fac.id} 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        {fac.avatar_url || fac.source_coverage?.avatar_url ? (
                          <img 
                            src={fac.avatar_url || fac.source_coverage?.avatar_url} 
                            alt={fac.canonical_name} 
                            className="w-9 h-9 rounded-lg object-cover border border-[var(--border-subtle)] shrink-0 mt-0.5 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fac.canonical_name || 'Dr')}&background=0D9488&color=ffffff&size=128&bold=true`
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                            {(fac.canonical_name || fac.display_name || 'Dr').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1.5">
                            {fac.canonical_name || fac.display_name}
                          </div>
                          {/* Disambiguation: Workplace & Department */}
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="flex items-center gap-1 text-[var(--text-secondary)] font-medium">
                              <Building2 size={12} className="text-[var(--text-muted)]" />
                              {fac.institution || 'Academic Institution'}
                            </span>
                            <span>•</span>
                            <span>{fac.department}</span>
                            {fac.employee_id && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                                  {fac.employee_id}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-[var(--text-secondary)] font-medium">
                      {fac.designation || 'Faculty Member'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${fac.completeness_score || 0}%`,
                              background: (fac.completeness_score || 0) >= 80 
                                ? 'var(--success)' 
                                : (fac.completeness_score || 0) >= 50 
                                ? 'var(--warning)' 
                                : 'var(--danger)'
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[var(--text-secondary)] w-8">
                          {fac.completeness_score || 0}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center items-center gap-1.5">
                        <span 
                          className={`inline-block w-2.5 h-2.5 rounded-full ${fac.source_coverage?.google_scholar ? 'bg-blue-500 shadow-sm' : 'bg-gray-300 dark:bg-gray-700'}`} 
                          title={`Google Scholar: ${fac.source_coverage?.google_scholar ? 'Connected' : 'Not Connected'}`} 
                        />
                        <span 
                          className={`inline-block w-2.5 h-2.5 rounded-full ${fac.source_coverage?.orcid ? 'bg-purple-500 shadow-sm' : 'bg-gray-300 dark:bg-gray-700'}`} 
                          title={`ORCID: ${fac.source_coverage?.orcid ? 'Connected' : 'Not Connected'}`} 
                        />
                        <span 
                          className={`inline-block w-2.5 h-2.5 rounded-full ${fac.source_coverage?.researchgate ? 'bg-green-500 shadow-sm' : 'bg-gray-300 dark:bg-gray-700'}`} 
                          title={`ResearchGate: ${fac.source_coverage?.researchgate ? 'Connected' : 'Not Connected'}`} 
                        />
                        <span 
                          className={`inline-block w-2.5 h-2.5 rounded-full ${fac.source_coverage?.institutional ? 'bg-amber-500 shadow-sm' : 'bg-gray-300 dark:bg-gray-700'}`} 
                          title={`Institutional ERP: ${fac.source_coverage?.institutional ? 'Connected' : 'Not Connected'}`} 
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-[var(--text-secondary)] text-xs">
                      {fac.last_synced_at ? formatRelativeTime(fac.last_synced_at) : 'Not synced yet'}
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant={fac.onboarding_status === 'active' ? 'success' : fac.onboarding_status === 'pending' ? 'warning' : 'neutral'}>
                        {fac.onboarding_status || 'active'}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Disambiguation Preview Button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPreviewFaculty(fac)}
                          className="text-xs gap-1"
                          title="Quick preview professor details"
                        >
                          <Eye size={13} />
                          Preview
                        </Button>
                        <Link href={ROUTES.faculty.profile(fac.id)}>
                          <Button variant="secondary" size="sm" className="gap-1 text-xs font-medium">
                            Profile
                            <ExternalLink size={12} />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setFacultyToDelete(fac)}
                          className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1.5 h-8 w-8"
                          title="Delete faculty profile"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredFaculty.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                        <Search size={22} />
                      </div>
                      <h4 className="font-semibold text-[var(--text-primary)]">No matching faculty found</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Try adjusting your search terms, clearing department filters, or add a new faculty member.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => {
                            setSearch('')
                            setStatusFilter('All')
                            setDepartmentFilter('All')
                          }}
                        >
                          Clear Filters
                        </Button>
                        <Link href={ROUTES.faculty.new}>
                          <Button variant="primary" size="sm" className="gap-1.5">
                            <Plus size={14} />
                            Add Faculty
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disambiguation Preview Modal */}
      <AnimatePresence>
        {previewFaculty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)] flex items-center justify-center font-bold text-lg">
                    {(previewFaculty.canonical_name || previewFaculty.display_name || 'Dr').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {previewFaculty.canonical_name || previewFaculty.display_name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {previewFaculty.designation || 'Faculty Member'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewFaculty(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Verified Identity Attributes */}
              <div className="p-6 space-y-4 text-sm">
                <div className="bg-[var(--bg-elevated)] p-4 rounded-xl space-y-3 border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-medium">Current Workplace</span>
                    <span className="font-semibold text-[var(--text-primary)] text-right flex items-center gap-1.5">
                      <Building2 size={14} className="text-[var(--accent)]" />
                      {previewFaculty.institution || 'National Institute of Technology Raipur'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-medium">Department</span>
                    <span className="font-semibold text-[var(--text-primary)] text-right">
                      {previewFaculty.department}
                    </span>
                  </div>
                  {previewFaculty.canonical_email && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-medium">Email Address</span>
                      <span className="font-mono text-xs text-[var(--accent)] text-right">
                        {previewFaculty.canonical_email}
                      </span>
                    </div>
                  )}
                  {previewFaculty.employee_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)] font-medium">Employee / Faculty ID</span>
                      <span className="font-mono text-xs text-[var(--text-secondary)] text-right">
                        {previewFaculty.employee_id}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)] font-medium">Last Aggregation Sync</span>
                    <span className="text-[var(--text-primary)]">
                      {previewFaculty.last_synced_at ? formatRelativeTime(previewFaculty.last_synced_at) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFacultyToDelete(previewFaculty)}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-500/10 gap-1.5"
                >
                  <Trash2 size={13} />
                  Delete Profile
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPreviewFaculty(null)}>
                    Close
                  </Button>
                  <Link href={ROUTES.faculty.profile(previewFaculty.id)}>
                    <Button variant="primary" size="sm" className="gap-1.5">
                      Open Full Profile
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {facultyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete Faculty Profile?</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Are you sure you want to permanently delete <strong className="text-[var(--text-primary)]">{facultyToDelete.canonical_name || facultyToDelete.display_name}</strong>? All associated publications, assessment scores, and identity records will be permanently removed.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={deleting}
                  onClick={() => setFacultyToDelete(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white border-transparent gap-1.5"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleting ? 'Deleting...' : 'Delete Profile'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
