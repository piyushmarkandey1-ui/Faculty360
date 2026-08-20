/**
 * Application route constants.
 * Use these instead of hardcoded strings to keep routing refactor-safe.
 */

export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  faculty: {
    list: '/faculty',
    new: '/faculty/new',
    profile: (id: string) => `/faculty/${id}`,
    review: (id: string) => `/faculty/${id}/review`,
    assessment: (id: string) => `/faculty/${id}/assessment`,
  },
  assessments: '/assessments',
  assessment: {
    evidence: (id: string) => `/assessment/${id}/evidence`,
  },
  settings: '/settings',
} as const
