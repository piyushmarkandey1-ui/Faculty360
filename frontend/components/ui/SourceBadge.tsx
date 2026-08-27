import React from 'react';
import { cn } from '@/lib/utils/cn';

export type AcademicSourceType = 'google_scholar' | 'researchgate' | 'institutional' | 'orcid' | 'openalex' | 'semantic_scholar' | 'dblp' | string;

interface SourceBadgeProps {
  source: AcademicSourceType;
  status: 'active' | 'syncing' | 'error' | 'pending';
  lastSynced?: string | null;
  className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  google_scholar: 'Google Scholar',
  researchgate: 'ResearchGate',
  institutional: 'Institutional',
  orcid: 'ORCID',
  openalex: 'OpenAlex',
  semantic_scholar: 'Semantic Scholar',
  dblp: 'DBLP'
};

const STATUS_COLORS = {
  active: 'bg-[var(--success)]',
  syncing: 'bg-[var(--warning)] animate-pulse',
  error: 'bg-[var(--danger)]',
  pending: 'bg-[var(--text-muted)]'
};

export function SourceBadge({ source, status, lastSynced, className }: SourceBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]", className)}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[var(--text-primary)]">{SOURCE_LABELS[source] || source}</span>
        <div className={cn("w-2 h-2 rounded-full shrink-0", STATUS_COLORS[status])} title={status} />
      </div>
      {lastSynced && status === 'active' && (
        <span className="text-[11px] text-[var(--text-muted)] border-l border-[var(--border-default)] pl-2">
          {new Date(lastSynced).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
