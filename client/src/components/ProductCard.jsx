import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/formatPrice'
import Icon from './Icon'
import StarRating from './StarRating'

const LOW_STOCK_THRESHOLD = 5

export default function ProductCard({ product }) {
  const { _id, title, price, stock, description, vendor, rating } = product

  return (
    <article className="card product-card">
      <h3><Link to={`/products/${_id}`}>{title}</Link></h3>
      <p className="product-price">{formatPrice(price)}</p>
      <StarRating rating={rating} />
      {description && <p className="product-description">{description}</p>}
      <div className="product-meta">
        {vendor && <span><Icon name="store" size={14} /> {vendor.name}</span>}
        {stock <= LOW_STOCK_THRESHOLD && <span className="badge badge-warn">Only {stock} left</span>}
      </div>
    </article>
  )
}
