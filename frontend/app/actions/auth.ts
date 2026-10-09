'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'

/**
 * Server action: sign the current user out of Tiger Data and redirect to /login.
 * Called from Client Components via a form action or button.
 */
export async function signOut() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('acadlens_token')
  } catch {
    // ignore
  }

  redirect(ROUTES.login)
}

