import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/formatDate'
import Alert from './Alert'
import DataState from './DataState'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import ReviewForm from './ReviewForm'
import Stars from './Stars'

function ReviewPrompt({ product, onReviewed }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [isPosted, setIsPosted] = useState(false)

  if (!isAuthenticated) {
    return <p><Link to="/login" state={{ from: location }}>Log in</Link> to write a review.</p>
  }
  // The server enforces this too; hiding the form just avoids a dead end.
  if (user._id === product.vendorId) return <p className="subtitle">You can't review your own product.</p>
  if (isPosted) return <Alert type="success">Thanks, your review was posted.</Alert>
  return (
    <ReviewForm
      productId={product._id}
      onSubmitted={() => {
        setIsPosted(true)
        onReviewed()
      }}
    />
  )
}

// `reviews` is the useFetch result for the current page, owned by the page so the header rating can share it.
export default function ReviewSection({ product, reviews, onPageChange, onReviewed }) {
  const { data, error, isLoading, reload } = reviews

  return (
    <section className="review-section" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">Reviews</h2>
      <ReviewPrompt product={product} onReviewed={onReviewed} />
      <DataState isLoading={isLoading} error={error} onRetry={reload}>
        {data?.reviews.length ? (
          <>
            <ul className="review-list">
              {data.reviews.map((review) => (
                <li key={review._id} className="card review-item">
                  <div className="review-head">
                    <strong>{review.reviewer?.name ?? 'Former user'}</strong>
                    <span className="subtitle">{formatDate(review.createdAt)}</span>
                  </div>
                  <p className="rating" aria-label={`Rated ${review.rating} out of 5`}>
                    <Stars value={review.rating} />
                  </p>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                </li>
              ))}
            </ul>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={onPageChange} />
          </>
        ) : (
          <EmptyState icon="star" title="No reviews yet">Be the first to share what you think.</EmptyState>
        )}
      </DataState>
    </section>
  )
}
