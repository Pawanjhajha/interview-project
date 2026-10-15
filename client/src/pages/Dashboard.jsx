import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import PageLayout from '../components/PageLayout'
import { useAuth } from '../hooks/useAuth'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not available'
}

export default function Dashboard() {
  const { user } = useAuth()

  const details = [
    { icon: 'user', label: 'Name', value: user.name },
    { icon: 'mail', label: 'Email', value: user.email },
    { icon: 'shield', label: 'Account type', value: user.role === 'merchant' ? 'Merchant' : 'Customer' },
    { icon: 'calendar', label: 'Member since', value: formatDate(user.createdAt) },
  ]

  return (
    <PageLayout>
      <section className="page-heading">
        <h1>Welcome back, {user.name}</h1>
        <p className="subtitle">Here's an overview of your account.</p>
      </section>

      <section aria-labelledby="account-heading">
        <h2 id="account-heading">Account details</h2>
        <dl className="detail-grid">
          {details.map(({ icon, label, value }) => (
            <div className="card detail-card" key={label}>
              <span className="detail-icon"><Icon name={icon} /></span>
              <div>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading">Shortcuts</h2>
        <div className="detail-grid">
          <Link to="/" className="card detail-card shortcut">
            <span className="detail-icon"><Icon name="store" /></span>
            <span>Browse the marketplace</span>
          </Link>
          {user.role === 'merchant' && (
            <>
              <Link to="/merchant/products" className="card detail-card shortcut">
                <span className="detail-icon"><Icon name="box" /></span>
                <span>Manage my products</span>
              </Link>
              <Link to="/merchant/sales" className="card detail-card shortcut">
                <span className="detail-icon"><Icon name="chart" /></span>
                <span>View my sales</span>
              </Link>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading">Recent activity</h2>
        <EmptyState title="Nothing here yet">Activity from your account will show up here.</EmptyState>
      </section>
    </PageLayout>
  )
}
