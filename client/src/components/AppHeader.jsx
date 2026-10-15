import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Brand from './Brand'
import { useCart } from '../hooks/useCart'
import Button from './Button'

export default function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Brand />
        <nav className="app-nav" aria-label="Main">
          <NavLink to="/" end>Marketplace</NavLink>
          {isAuthenticated && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user?.role === 'merchant' && <NavLink to="/merchant/products">My products</NavLink>}
          {user?.role === 'merchant' && <NavLink to="/merchant/sales">Sales</NavLink>}
          {isAuthenticated && <NavLink to="/orders">Orders</NavLink>}
          {isAuthenticated && (
            <NavLink to="/cart">
              Cart{itemCount > 0 && <span className="cart-count" aria-label={`${itemCount} items`}>{itemCount}</span>}
            </NavLink>
          )}
        </nav>
        {isAuthenticated ? (
          <div className="app-header-user">
            <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user.name}</span>
            <Button variant="secondary" icon="logout" loading={loggingOut} loadingLabel="Logging out..." onClick={handleLogout}>
              Log out
            </Button>
          </div>
        ) : (
          <div className="app-header-user">
            <Link to="/login" className="btn btn-secondary">Log in</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </div>
        )}
      </div>
    </header>
  )
}
