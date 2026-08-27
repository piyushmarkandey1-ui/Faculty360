import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client.
 * Use this in Server Components, Route Handlers, and Server Actions.
 * Session is read from HTTP cookies — never persisted to localStorage.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdupsgwzannwmjopjyor.supabase.co'
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cTShNqV_MfRClLRTHwuQcw_Kn01GBGG'
  const url = String(rawUrl).replace(/[\r\n\s"']+/g, '').replace(/\/+$/, '')
  const key = String(rawKey).replace(/[\r\n\s"']+/g, '')

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie mutation is silently ignored.
            // The middleware handles the actual session refresh.
          }
        },
      },
    }
  )
}
