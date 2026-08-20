import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from './Badge';

interface SourceBadgeProps {
  source: 'google_scholar' | 'researchgate' | 'institutional' | 'orcid';
  status: 'active' | 'syncing' | 'error' | 'pending';
  lastSynced?: string | null;
  className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  google_scholar: 'Google Scholar',
  researchgate: 'ResearchGate',
  institutional: 'Institutional',
  orcid: 'ORCID'
};

const STATUS_COLORS = {
  active: 'bg-[var(--success)]',
  syncing: 'bg-[var(--warning)] animate-pulse',
  error: 'bg-[var(--danger)]',
  pending: 'bg-[var(--text-muted)]'
};

export function SourceBadge({ source, status, lastSynced, className }: SourceBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)]", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{SOURCE_LABELS[source] || source}</span>
        <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[status])} title={status} />
      </div>
      {lastSynced && status === 'active' && (
        <span className="text-xs text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-2">
          {new Date(lastSynced).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
