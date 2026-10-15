import Icon from './Icon'

const STARS = [1, 2, 3, 4, 5]

// Radio group styled as stars. `onChange` gets a normal change event (name "rating"), so it plugs into useFormState.
export default function StarInput({ value, onChange, error, disabled }) {
  const selected = Number(value) || 0

  return (
    <fieldset className="form-field star-input" disabled={disabled} aria-describedby={error ? 'rating-error' : undefined}>
      <legend>Your rating</legend>
      <div className="star-input-stars">
        {STARS.map((n) => (
          <span key={n}>
            <input type="radio" id={`rating-${n}`} name="rating" value={String(n)} checked={selected === n} onChange={onChange} />
            <label htmlFor={`rating-${n}`} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}>
              <Icon name="star" size={28} fill={n <= selected ? 'currentColor' : 'none'} />
            </label>
          </span>
        ))}
      </div>
      {error && <span id="rating-error" className="field-error" role="alert">{error}</span>}
    </fieldset>
  )
}
