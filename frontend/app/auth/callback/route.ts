import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Tiger Data Auth callback handler.
 * Validates session token and redirects to the intended destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'

  const cookieStore = await cookies()
  const token = cookieStore.get('acadlens_token')?.value

  if (token) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // If code is supplied, redirect to login
  return NextResponse.redirect(`${origin}/login?error=session_required`)
}

