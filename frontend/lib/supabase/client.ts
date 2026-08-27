import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Use this in 'use client' components.
 * Reads credentials from public env vars — safe to use in the browser.
 */
export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdupsgwzannwmjopjyor.supabase.co'
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cTShNqV_MfRClLRTHwuQcw_Kn01GBGG'
  const url = String(rawUrl).replace(/[\r\n\s"']+/g, '').replace(/\/+$/, '')
  const key = String(rawKey).replace(/[\r\n\s"']+/g, '')
  return createBrowserClient(url, key)
}

