import Icon from './Icon'

export default function Button({ variant = 'primary', loading = false, loadingLabel = 'Please wait...', icon, className = '', children, disabled, ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`.trim()} disabled={disabled || loading} {...props}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={18} />}
      {loading ? loadingLabel : children}
    </button>
  )
}
