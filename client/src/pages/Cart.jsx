import { Link } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import CartLine from '../components/CartLine'
import DataState from '../components/DataState'
import EmptyState from '../components/EmptyState'
import OrderCard from '../components/OrderCard'
import PageLayout from '../components/PageLayout'
import { useCart } from '../hooks/useCart'
import { useCheckout } from '../hooks/useCheckout'
import { useFetch } from '../hooks/useFetch'
import { formatPrice } from '../utils/formatPrice'
import { getErrorMessage } from '../utils/getErrorMessage'

function OrderPlaced({ order }) {
  return (
    <section className="order-success">
      <Alert type="success">Thank you! Your order has been placed.</Alert>
      <OrderCard order={order} />
      <div className="form-actions">
        <Link to="/orders" className="btn btn-primary">View my orders</Link>
        <Link to="/" className="btn btn-secondary">Keep shopping</Link>
      </div>
    </section>
  )
}

export default function Cart() {
  const { items, itemCount, total, updateQuantity, removeFromCart, refreshCart } = useCart()
  const { isSubmitting, error, order, submit } = useCheckout()
  const { isLoading } = useFetch(refreshCart)

  return (
    <PageLayout>
      <section className="page-heading">
        <h1>Your cart</h1>
      </section>
      {order ? (
        <OrderPlaced order={order} />
      ) : (
        <DataState isLoading={isLoading}>
          {items.length === 0 ? (
            <EmptyState icon="cart" title="Your cart is empty" action={<Link to="/" className="btn btn-primary">Browse products</Link>}>
              Add something from the marketplace to get started.
            </EmptyState>
          ) : (
            <div className="cart-layout">
              <ul className="cart-lines">
                {items.map((item) => (
                  <CartLine key={item.productId} item={item} onQuantityChange={updateQuantity} onRemove={removeFromCart} />
                ))}
              </ul>
              <aside className="card cart-summary" aria-label="Order summary">
                <h2>Summary</h2>
                <p className="summary-row"><span>Items</span> <span>{itemCount}</span></p>
                <p className="summary-row summary-total"><span>Total</span> <strong>{formatPrice(total)}</strong></p>
                {error && <Alert type="error">{getErrorMessage(error)}</Alert>}
                <Button icon="check" loading={isSubmitting} loadingLabel="Placing order..." onClick={submit}>
                  Checkout
                </Button>
                <p className="subtitle">Final prices are confirmed by the server when you check out.</p>
              </aside>
            </div>
          )}
        </DataState>
      )}
    </PageLayout>
  )
}
