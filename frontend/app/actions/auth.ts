'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'

/**
 * Server action: sign the current user out of Supabase and redirect to /login.
 * Called from Client Components via a form action or button.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(ROUTES.login)
}
