import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { MAX_QUANTITY, quantityOf } from '../utils/cart'
import Button from './Button'

export default function AddToCartButton({ product }) {
  const { user, isAuthenticated } = useAuth()
  const { items, addToCart } = useCart()
  const location = useLocation()

  if (product.stock < 1) return null
  if (!isAuthenticated) {
    return <Link to="/login" state={{ from: location }} className="btn btn-primary">Log in to buy</Link>
  }
  // The server rejects this too; hiding the button just avoids a pointless dead end.
  if (user._id === product.vendorId) return <p className="subtitle">This is your product.</p>

  const inCart = quantityOf(items, product._id)
  const isMaxed = inCart >= Math.min(product.stock, MAX_QUANTITY)

  return (
    <div className="add-to-cart">
      <Button icon="cart" disabled={isMaxed} onClick={() => addToCart(product)}>
        {isMaxed ? 'Maximum in cart' : 'Add to cart'}
      </Button>
      {inCart > 0 && (
        <p className="subtitle" role="status">
          {inCart} in your cart · <Link to="/cart">View cart</Link>
        </p>
      )}
    </div>
  )
}
