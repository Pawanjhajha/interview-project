import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoader from './PageLoader'
import { useAuth } from '../hooks/useAuth'
import { getPostLoginPath } from '../utils/redirect'

// Keeps logged-in users away from the login and register pages. It is also the single place that
// sends a user onward after they authenticate, so the original destination is never lost.
export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />
  return isAuthenticated ? <Navigate to={getPostLoginPath(location)} replace /> : <Outlet />
}
