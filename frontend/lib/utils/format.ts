/**
 * Formatting utilities for display values.
 */

/** Formats a number score to 1 decimal place. e.g. 84.5 */
export function formatScore(value: number): string {
  return value.toFixed(1)
}

/** Formats a number as a percentage. e.g. 84.5 → "84.5%" */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/** Formats a large number with commas. e.g. 1840 → "1,840" */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

/** Returns a relative time string. e.g. "2 days ago" */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Returns display label for a source type. */
export function formatSourceType(source: string): string {
  const labels: Record<string, string> = {
    google_scholar: 'Google Scholar',
    researchgate: 'ResearchGate',
    institutional: 'Institutional',
    orcid: 'ORCID',
  }
  return labels[source] ?? source
}
