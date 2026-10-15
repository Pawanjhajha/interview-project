import AuthForm from '../components/AuthForm'
import { useAuth } from '../hooks/useAuth'
import { validateRegister } from '../utils/validators'

const fields = [
  { name: 'name', label: 'Name', type: 'text', icon: 'user', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', icon: 'mail', placeholder: 'you@example.com', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', icon: 'lock', hint: 'At least 8 characters.', autoComplete: 'new-password' },
  {
    name: 'role',
    label: 'I want to',
    as: 'select',
    options: [
      { value: 'customer', label: 'Shop from merchants' },
      { value: 'merchant', label: 'Sell my own products' },
    ],
  },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', icon: 'lock', autoComplete: 'new-password' },
]

// After a successful registration, GuestRoute redirects to the default authenticated page.
export default function Register() {
  const { register } = useAuth()

  // confirmPassword is a client-only check and is never sent to the API.
  const handleSubmit = async ({ name, email, password, role }) => {
    await register({ name, email, password, role })
  }

  return (
    <AuthForm
      title="Create your account"
      subtitle="It only takes a minute."
      fields={fields}
      initialValues={{ role: 'customer' }}
      submitLabel="Register"
      validate={validateRegister}
      onSubmit={handleSubmit}
      footer={{ text: 'Already have an account?', to: '/login', linkLabel: 'Log in' }}
    />
  )
}
