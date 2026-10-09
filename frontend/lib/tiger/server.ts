/**
 * Tiger Data server-side configuration.
 * Handles server-side Tiger Data sessions and auth tokens via Next.js cookies.
 */
import { cookies } from 'next/headers'

export async function getTigerSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get('acadlens_token')?.value
}

export const tigerServerConfig = {
  engine: 'TimescaleDB / PostgreSQL',
  serviceId: 'tt158v5sae',
  database: 'faculty360-db',
  cloud: 'Tiger Cloud'
}
