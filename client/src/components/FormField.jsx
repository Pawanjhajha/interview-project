import { useState } from 'react'
import Icon from './Icon'

// `as` switches the control: 'input' (default), 'textarea', or 'select' (with `options`).
export default function FormField({ label, name, error, icon, hint, type, as: Control = 'input', options, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const errorId = `${name}-error`
  const hintId = `${name}-hint`

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <div className="input-wrap">
        {icon && <Icon name={icon} size={18} className="input-icon" />}
        <Control
          id={name}
          name={name}
          type={Control === 'input' ? (isPassword && showPassword ? 'text' : type) : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={isPassword ? 'has-toggle' : undefined}
          {...inputProps}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Control>
        {isPassword && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {hint && !error && <span id={hintId} className="field-hint">{hint}</span>}
      {error && <span id={errorId} className="field-error">{error}</span>}
    </div>
  )
}
