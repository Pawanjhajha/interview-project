import { Link } from 'react-router-dom'
import { MAX_QUANTITY, lineTotal } from '../utils/cart'
import { formatPrice } from '../utils/formatPrice'
import Button from './Button'
import Icon from './Icon'

export default function CartLine({ item, onQuantityChange, onRemove }) {
  const { productId, title, price, stock, quantity } = item
  const max = Math.min(stock, MAX_QUANTITY)

  return (
    <li className="card cart-line">
      <div className="cart-line-info">
        <h3><Link to={`/products/${productId}`}>{title}</Link></h3>
        <p className="subtitle">{formatPrice(price)} each</p>
        {quantity >= stock && <p className="badge badge-warn">Only {stock} in stock</p>}
      </div>
      <div className="quantity-stepper" role="group" aria-label={`Quantity of ${title}`}>
        <button type="button" className="btn btn-secondary" aria-label={`Decrease quantity of ${title}`} disabled={quantity <= 1} onClick={() => onQuantityChange(productId, quantity - 1)}>
          <Icon name="minus" size={16} />
        </button>
        <span aria-live="polite">{quantity}</span>
        <button type="button" className="btn btn-secondary" aria-label={`Increase quantity of ${title}`} disabled={quantity >= max} onClick={() => onQuantityChange(productId, quantity + 1)}>
          <Icon name="plus" size={16} />
        </button>
      </div>
      <p className="cart-line-total" aria-label={`Subtotal for ${title}`}>{formatPrice(lineTotal(item))}</p>
      <Button variant="secondary" className="btn-danger" icon="trash" aria-label={`Remove ${title} from cart`} onClick={() => onRemove(productId)}>
        Remove
      </Button>
    </li>
  )
}
