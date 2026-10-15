import Stars from './Stars'

// Read-only summary: stars for the rounded average plus "4.3 (12)"; `rating` is { average, count }.
export default function StarRating({ rating }) {
  const { average, count } = rating ?? { average: 0, count: 0 }
  if (count === 0) return <p className="rating rating-empty">No reviews yet</p>

  return (
    <p className="rating" aria-label={`Rated ${average} out of 5 from ${count} ${count === 1 ? 'review' : 'reviews'}`}>
      <Stars value={Math.round(average)} />
      <span aria-hidden="true">{average.toFixed(1)} ({count})</span>
    </p>
  )
}
