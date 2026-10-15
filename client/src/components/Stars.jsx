import Icon from './Icon'

const STARS = [1, 2, 3, 4, 5]

// Decorative row of five stars, `value` of them filled (hidden from screen readers; callers add the text).
export default function Stars({ value, size = 16 }) {
  return (
    <span className="stars" aria-hidden="true">
      {STARS.map((n) => (
        <Icon key={n} name="star" size={size} fill={n <= value ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}
