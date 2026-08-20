'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SourceBadge } from '@/components/ui/SourceBadge'
import { ROUTES } from '@/lib/constants/routes'
import { MOCK_CONFLICTS, MOCK_FACULTY_PROFILES } from '@/mock-data'

export default function FacultyReviewPage({ params }: { params: { id: string } }) {
  const profile = MOCK_FACULTY_PROFILES[params.id] || MOCK_FACULTY_PROFILES['faculty-001']
  const [conflicts, setConflicts] = useState(MOCK_CONFLICTS)
  const [duplicates, setDuplicates] = useState([
    { id: 'dup1', title1: 'Deep Learning for Medical Image Analysis', title2: 'Deep Learning in Medical Imaging', venue: 'IEEE TMI 2024', status: 'UNRESOLVED' },
    { id: 'dup2', title1: 'A Survey on Edge Computing', title2: 'Survey: Edge Computing Architectures', venue: 'ACM Computing Surveys', status: 'UNRESOLVED' },
    { id: 'dup3', title1: 'Robust Reinforcement Learning', title2: 'Robust RL for Robotics', venue: 'NeurIPS 2023', status: 'UNRESOLVED' }
  ])

  const resolveConflict = (id: string) => {
    setConflicts(prev => prev.map(c => c.id === id ? { ...c, resolution: 'source_a' as const } : c))
  }

  const resolveDuplicate = (id: string) => {
    setDuplicates(prev => prev.map(d => d.id === id ? { ...d, status: 'RESOLVED' } : d))
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link href={ROUTES.faculty.profile(profile.entity.id)} className="inline-flex items-center text-sm font-medium hover:underline mb-4" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} className="mr-1" /> Back to Profile
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Data Review Hub</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Review conflicts and duplicates for {profile.unified_profile.display_name}.</p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completeness', value: '84%' },
          { label: 'Verification Score', value: '91%' },
          { label: 'Resolved Duplicates', value: duplicates.filter(d => d.status === 'RESOLVED').length.toString() },
          { label: 'Pending Conflicts', value: conflicts.filter(c => c.resolution === 'unresolved').length.toString() }
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Conflicts Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Source Conflicts Requiring Review
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--warning)] text-white">
            {conflicts.filter(c => c.resolution === 'unresolved').length}
          </span>
        </h2>
        
        <div className="space-y-4">
          <AnimatePresence>
            {conflicts.filter(c => c.resolution === 'unresolved').map(conflict => (
              <motion.div 
                key={conflict.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-xl border flex flex-col md:flex-row gap-6" 
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="w-full md:w-1/4">
                  <h3 className="font-medium text-sm mb-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    {conflict.field_name.replace('_', ' ')}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mismatch detected across sources.</p>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => resolveConflict(conflict.id)}
                    className="text-left p-4 rounded-lg border hover:border-[var(--accent)] transition-colors group relative" 
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <SourceBadge source={conflict.source_a} status="active" /> {conflict.source_a}
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{String(conflict.value_a)}</div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                  </button>
                  <button 
                    onClick={() => resolveConflict(conflict.id)}
                    className="text-left p-4 rounded-lg border hover:border-[var(--accent)] transition-colors group relative" 
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <SourceBadge source={conflict.source_b} status="active" /> {conflict.source_b}
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{String(conflict.value_b)}</div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
                    </div>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {conflicts.filter(c => c.resolution === 'unresolved').length === 0 && (
            <div className="p-8 rounded-xl border text-center text-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              All conflicts resolved!
            </div>
          )}
        </div>
      </section>

      {/* Duplicates Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          Potential Duplicate Publications
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent)] text-white">
            {duplicates.filter(d => d.status === 'UNRESOLVED').length}
          </span>
        </h2>
        
        <div className="space-y-4">
          <AnimatePresence>
            {duplicates.filter(d => d.status === 'UNRESOLVED').map(dup => (
              <motion.div 
                key={dup.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-xl border" 
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2 mb-4 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <GitMerge size={14} /> Similar Titles Detected
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg border bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{dup.title1}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{dup.venue}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{dup.title2}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{dup.venue}</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="primary" size="sm" onClick={() => resolveDuplicate(dup.id)}>Merge Records</Button>
                  <Button variant="secondary" size="sm" onClick={() => resolveDuplicate(dup.id)}>Keep Separate</Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {duplicates.filter(d => d.status === 'UNRESOLVED').length === 0 && (
            <div className="p-8 rounded-xl border text-center text-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              No duplicates pending review.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
