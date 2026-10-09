'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'
import { API_BASE_URL } from '@/lib/constants/config'

/**
 * Server action: sign the current user out of Tiger Data and redirect to /login.
 * Records the logout audit event in Tiger Data and clears the session cookie.
 */
export async function signOut() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('acadlens_token')?.value
    cookieStore.delete('acadlens_token')

    if (token) {
      const rawBase = (process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || 'http://localhost:8000/api').trim()
      const baseUrl = rawBase.replace(/[\r\n\s]+/g, '').replace(/\/+$/, '')
      const logoutUrl = baseUrl.endsWith('/api') ? `${baseUrl}/auth/logout` : `${baseUrl}/api/auth/logout`
      await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => null)
    }
  } catch {
    // ignore
  }

  redirect(ROUTES.login)
}
