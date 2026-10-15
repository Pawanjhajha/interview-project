import Icon from './Icon'

export default function StatCard({ icon, label, value }) {
  return (
    <div className="card stat-card">
      <span className="detail-icon"><Icon name={icon} /></span>
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  )
}
