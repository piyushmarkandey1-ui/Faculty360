/**
 * API client typed wrappers.
 * All fetch calls go through these functions â€” never raw fetch in components.
 * Types are sourced from /types â€” keeping API contract and UI types in sync.
 */

import { API_BASE_URL } from '@/lib/constants/config'
import type { FacultySummary, FacultyProfileResponse, ProfileConflict, Publication } from '@/types/faculty'
import type { Assessment, AssessmentSummary } from '@/types/assessment'

import { createClient } from '@/lib/supabase/client'

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function getAuthToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {})
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error?.detail ?? 'API request failed')
  }

  return res.json() as Promise<T>
}

// â”€â”€ Scholar Sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface SyncScholarResult {
  source: string
  status: string
  message?: string
  publicationsFound: number
  publicationsAdded: number
  publicationsUpdated: number
  citations: number
  hIndex: number
}

export async function syncGoogleScholar(facultyId: string, scholarUrl: string): Promise<SyncScholarResult> {
  return apiFetch<SyncScholarResult>(`/faculty/${facultyId}/sources/google-scholar/sync`, {
    method: 'POST',
    body: JSON.stringify({ scholar_url: scholarUrl })
  })
}

export async function syncSource(facultyId: string, sourceType: string, url: string): Promise<SyncScholarResult> {
  return apiFetch<SyncScholarResult>(`/faculty/${facultyId}/sources/${sourceType}/sync`, {
    method: 'POST',
    body: JSON.stringify({ url })
  })
}

// â”€â”€ Faculty â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface FacultyListParams {
  page?: number
  limit?: number
  search?: string
  department?: string
  status?: string
}

export interface FacultyListResponse {
  items: FacultySummary[]
  total: number
  page: number
  limit: number
}

export async function getFacultyList(params: FacultyListParams = {}): Promise<FacultyListResponse> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString()
  return apiFetch<FacultyListResponse>(`/faculty${qs ? `?${qs}` : ''}`)
}

export async function getFacultyProfile(id: string): Promise<FacultyProfileResponse> {
  return apiFetch<FacultyProfileResponse>(`/faculty/${id}`)
}

export async function getFacultyConflicts(id: string): Promise<{ items: ProfileConflict[] }> {
  return apiFetch<{ items: ProfileConflict[] }>(`/faculty/${id}/conflicts`)
}

export async function getFacultyPublications(id: string): Promise<{ items: Publication[] }> {
  return apiFetch<{ items: Publication[] }>(`/faculty/${id}/publications`)
}

export async function resolveConflict(
  facultyId: string,
  conflictId: string,
  resolution: 'source_a' | 'source_b' | 'manual'
): Promise<ProfileConflict> {
  return apiFetch<ProfileConflict>(`/faculty/${facultyId}/conflicts/${conflictId}`, {
    method: 'PATCH',
    body: JSON.stringify({ resolution }),
  })
}

// â”€â”€ Ingestion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface IngestionJobResponse {
  job_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  estimated_duration_seconds?: number
}

export async function triggerIngestion(
  facultyId: string,
  source: string
): Promise<IngestionJobResponse> {
  return apiFetch<IngestionJobResponse>('/ingestion/trigger', {
    method: 'POST',
    body: JSON.stringify({ faculty_id: facultyId, source }),
  })
}

export async function getIngestionStatus(jobId: string): Promise<IngestionJobResponse> {
  return apiFetch<IngestionJobResponse>(`/ingestion/status/${jobId}`)
}

// â”€â”€ Assessment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function runAssessment(facultyId: string): Promise<AssessmentSummary> {
  return apiFetch<AssessmentSummary>('/assessment/run', {
    method: 'POST',
    body: JSON.stringify({ faculty_id: facultyId }),
  })
}

export async function getAssessment(assessmentId: string): Promise<Assessment> {
  return apiFetch<Assessment>(`/assessment/${assessmentId}`)
}

// â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface DashboardSummary {
  faculty_total: number
  faculty_active: number
  assessments_this_cycle: number
  avg_completeness: number
  pending_conflicts: number
  last_ingestion_at: string | null
  source_health: Record<string, 'healthy' | 'degraded' | 'offline'>
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary')
}

// ── Assessment ──────────────────────────────────────────────────────────────

export async function getAssessmentFramework() {
  return apiFetch('/assessment/framework')
}

export async function getFacultyAssessment(facultyId: string) {
  return apiFetch(`/faculty/${facultyId}/assessment`)
}

export async function calculateFacultyAssessment(facultyId: string) {
  return apiFetch(`/faculty/${facultyId}/assessment/calculate`, {
    method: 'POST'
  })
}

export async function generateFacultyInsights(facultyId: string) {
  return apiFetch(`/faculty/${facultyId}/insights`, {
    method: 'POST'
  })
}
