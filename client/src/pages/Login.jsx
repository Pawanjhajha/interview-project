import AuthForm from '../components/AuthForm'
import { useAuth } from '../hooks/useAuth'
import { validateLogin } from '../utils/validators'

const fields = [
  { name: 'email', label: 'Email', type: 'email', icon: 'mail', placeholder: 'you@example.com', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', icon: 'lock', autoComplete: 'current-password' },
]

// After a successful login, GuestRoute redirects to the intended page.
export default function Login() {
  const { login, sessionExpired } = useAuth()

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Log in to your account to continue."
      fields={fields}
      submitLabel="Log in"
      validate={validateLogin}
      notice={sessionExpired ? 'Your session has expired. Please log in again.' : ''}
      onSubmit={login}
      footer={{ text: "Don't have an account?", to: '/register', linkLabel: 'Register' }}
    />
  )
}
