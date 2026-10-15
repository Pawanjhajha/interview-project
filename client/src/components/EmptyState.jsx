import Icon from './Icon'

export default function EmptyState({ icon = 'inbox', title, children, action }) {
  return (
    <div className="card empty-state">
      <span className="empty-icon"><Icon name={icon} size={28} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}
