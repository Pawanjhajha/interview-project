import Icon from './Icon'

const ICONS = { error: 'alert', success: 'check', info: 'info' }

// `error` is announced immediately (role="alert"); `info` and `success` politely (role="status").
export default function Alert({ type = 'info', children }) {
  return (
    <p className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon name={ICONS[type]} size={18} />
      <span>{children}</span>
    </p>
  )
}
