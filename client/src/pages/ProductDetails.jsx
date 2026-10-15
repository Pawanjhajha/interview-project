import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProduct } from '../api/products'
import { fetchReviews } from '../api/reviews'
import AddToCartButton from '../components/AddToCartButton'
import DataState from '../components/DataState'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import PageLayout from '../components/PageLayout'
import ReviewSection from '../components/ReviewSection'
import StarRating from '../components/StarRating'
import { useFetch } from '../hooks/useFetch'
import { formatPrice } from '../utils/formatPrice'

const BackLink = () => (
  <Link to="/" className="back-link"><Icon name="arrowLeft" size={16} /> Back to marketplace</Link>
)

export default function ProductDetails() {
  const { id } = useParams()
  const fetcher = useCallback(() => fetchProduct(id), [id])
  const { data: product, error, isLoading, reload } = useFetch(fetcher)
  const [reviewPage, setReviewPage] = useState(1)
  const reviewsFetcher = useCallback(() => fetchReviews(id, { page: reviewPage }), [id, reviewPage])
  const reviews = useFetch(reviewsFetcher)

  // A new review changes the average, so it comes from the reviews response once that has loaded.
  const rating = reviews.data?.rating ?? product?.rating
  const handleReviewed = () => {
    setReviewPage(1)
    reviews.reload()
  }

  return (
    <PageLayout>
      <BackLink />
      {error?.response?.status === 404 ? (
        <EmptyState icon="box" title="Product not found">This product doesn't exist or was removed.</EmptyState>
      ) : (
        <DataState isLoading={isLoading} error={error} onRetry={reload}>
          {product && (
            <article className="card product-details">
              <h1>{product.title}</h1>
              <p className="product-price product-price-lg">{formatPrice(product.price)}</p>
              <StarRating rating={rating} />
              <p className={`badge ${product.stock > 0 ? 'badge-ok' : 'badge-danger'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
              <AddToCartButton product={product} />
              <h2>Description</h2>
              <p className="product-full-description">{product.description || 'The merchant has not added a description.'}</p>
              <h2>Vendor</h2>
              <p className="vendor-line">
                <Icon name="store" size={18} /> {product.vendor?.name ?? 'Vendor unavailable'}
              </p>
            </article>
          )}
        </DataState>
      )}
      {product && <ReviewSection product={product} reviews={reviews} onPageChange={setReviewPage} onReviewed={handleReviewed} />}
    </PageLayout>
  )
}
