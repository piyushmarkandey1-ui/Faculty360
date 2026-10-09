import { NextResponse, type NextRequest } from 'next/server'

/**
 * AcadLens / Faculty360 route protection middleware.
 * Powered 100% by Tiger Data sessions.
 *
 * Protected routes (under /dashboard, /faculty, /assessments,
 * /assessment, /settings, /reports) require an active session token.
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

  // Check for Tiger Data auth token in cookies
  const acadlensToken = request.cookies.get('acadlens_token')?.value
  const isAuthenticated = Boolean(acadlensToken && acadlensToken.length > 5)

  if (isAuthenticated) {
    if (pathname === '/login') {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }
    return NextResponse.next()
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
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
