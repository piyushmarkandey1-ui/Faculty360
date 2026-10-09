/**
 * Tiger Data client configuration.
 * All client-side requests in AcadLens route directly through Tiger Data API.
 */
import { apiFetch, getAuthToken, loginUser, logoutUser, demoLoginUser } from '@/lib/api/client'

export { apiFetch, getAuthToken, loginUser, logoutUser, demoLoginUser }

export const tigerConfig = {
  engine: 'TimescaleDB / PostgreSQL',
  serviceId: 'tt158v5sae',
  database: 'faculty360-db',
  cloud: 'Tiger Cloud'
}
