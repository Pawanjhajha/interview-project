import { Link, Outlet } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { useAuth } from '../hooks/useAuth'

// Nested inside ProtectedRoute, so `user` always exists. UX only: the API enforces the role too.
export default function MerchantRoute() {
  const { user } = useAuth()

  if (user.role !== 'merchant') {
    return (
      <AuthLayout title="Merchant access only" subtitle="Your account is a customer account, so it can't manage products.">
        <Link to="/dashboard" className="btn btn-primary btn-block">Back to dashboard</Link>
      </AuthLayout>
    )
  }
  return <Outlet />
}
