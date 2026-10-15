import { lineTotal } from '../utils/cart'
import { formatDate } from '../utils/formatDate'
import { formatPrice } from '../utils/formatPrice'

// `order.items` carry the title and unit price from purchase time, so this never reflects later edits.
export default function OrderCard({ order }) {
  return (
    <article className="card order-card">
      <header className="order-header">
        <div>
          <h3>Order #{order._id.slice(-8)}</h3>
          <p className="subtitle">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${order.status === 'cancelled' ? 'badge-danger' : 'badge-ok'}`}>{order.status}</span>
      </header>
      <ul className="order-items">
        {order.items.map((item) => (
          <li key={item.productId}>
            <span className="order-item-title">{item.title}</span>
            <span className="subtitle">{item.quantity} × {formatPrice(item.price)}</span>
            <span>{formatPrice(lineTotal(item))}</span>
          </li>
        ))}
      </ul>
      <p className="order-total"><span>Total</span> <strong>{formatPrice(order.totalPrice)}</strong></p>
    </article>
  )
}
