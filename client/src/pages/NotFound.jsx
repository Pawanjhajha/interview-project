import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export default function NotFound() {
  return (
    <AuthLayout title="Page not found" subtitle="The page you're looking for doesn't exist or has moved.">
      <Link to="/" className="btn btn-primary btn-block">Go home</Link>
    </AuthLayout>
  )
}
