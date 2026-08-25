import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Use this in 'use client' components.
 * Reads credentials from public env vars — safe to use in the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
