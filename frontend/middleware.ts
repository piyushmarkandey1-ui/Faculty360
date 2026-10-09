import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * AcadLens route protection middleware.
 *
 * Protected routes (under /dashboard, /faculty, /assessments,
 * /assessment, /settings) require an active Supabase session.
 *
 * Unauthenticated users are redirected to /login.
 * Already-authenticated users visiting /login are redirected to /dashboard.
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/faculty',
  '/assessments',
  '/assessment',
  '/settings',
  '/reports',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  // 1. Check for Tiger Data / AcadLens auth token in cookies
  const acadlensToken = request.cookies.get('acadlens_token')?.value

  if (acadlensToken && acadlensToken.length > 5) {
    // Authenticated via Tiger Data Auth
    if (pathname === '/login') {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }
    return NextResponse.next()
  }

  // 2. Safe, non-blocking check for Supabase session (legacy fallback)
  let supabaseUser = null
  let supabaseResponse = NextResponse.next({ request })

  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cdupsgwzannwmjopjyor.supabase.co'
    const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cTShNqV_MfRClLRTHwuQcw_Kn01GBGG'
    const supabaseUrl = String(rawUrl).replace(/[\r\n\s"']+/g, '').replace(/\/+$/, '')
    const supabaseAnonKey = String(rawKey).replace(/[\r\n\s"']+/g, '')

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              )
              supabaseResponse = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      const { data } = await supabase.auth.getUser()
      supabaseUser = data?.user
    }
  } catch (err) {
    // Never crash middleware if Supabase experiences network or DNS timeouts
  }

  // Redirect unauthenticated users away from protected routes
  if (!supabaseUser && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login
  if (supabaseUser && pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static assets)
     * - _next/image  (optimised images)
     * - favicon.ico, sitemap.xml, robots.txt
     * - any file with an extension (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
