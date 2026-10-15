// Pure cart helpers. A cart item is { productId, title, price, stock, quantity }; price and stock are
// only a display snapshot, the server recalculates everything at checkout.
export const MAX_QUANTITY = 99

const maxFor = ({ stock }) => Math.min(stock, MAX_QUANTITY)
const clamp = (item, quantity) => Math.max(1, Math.min(quantity, maxFor(item)))
const toSnapshot = ({ _id, title, price, stock }) => ({ productId: _id, title, price, stock })

// Money is summed in whole cents so floating point never drifts.
const cents = ({ price, quantity }) => Math.round(price * 100) * quantity

export const lineTotal = (item) => cents(item) / 100
export const cartTotal = (items) => items.reduce((sum, item) => sum + cents(item), 0) / 100
export const countItems = (items) => items.reduce((sum, { quantity }) => sum + quantity, 0)
export const quantityOf = (items, productId) => items.find((item) => item.productId === productId)?.quantity ?? 0
export const toCheckoutItems = (items) => items.map(({ productId, quantity }) => ({ productId, quantity }))

export const addItem = (items, product, quantity = 1) => {
  if (product.stock < 1) return items
  const snapshot = toSnapshot(product)
  if (!items.some((item) => item.productId === snapshot.productId)) {
    return [...items, { ...snapshot, quantity: clamp(snapshot, quantity) }]
  }
  return items.map((item) =>
    item.productId === snapshot.productId ? { ...snapshot, quantity: clamp(snapshot, item.quantity + quantity) } : item,
  )
}

export const setQuantity = (items, productId, quantity) =>
  items.map((item) => (item.productId === productId ? { ...item, quantity: clamp(item, quantity) } : item))

export const removeItem = (items, productId) => items.filter((item) => item.productId !== productId)

// `latest` maps productId to the current product, or null when it no longer exists. Ids that are
// missing from it (e.g. a failed request) are left untouched; sold-out products leave the cart.
export const applyLatest = (items, latest) =>
  items.flatMap((item) => {
    if (!(item.productId in latest)) return [item]
    const product = latest[item.productId]
    if (!product || product.stock < 1) return []
    const snapshot = toSnapshot(product)
    return [{ ...snapshot, quantity: clamp(snapshot, item.quantity) }]
  })

// Stored carts are untrusted input (the user can edit localStorage): keep only well-formed lines.
export const sanitize = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item) =>
        item &&
        typeof item.productId === 'string' &&
        typeof item.title === 'string' &&
        Number.isFinite(item.price) && item.price > 0 &&
        Number.isInteger(item.stock) && item.stock >= 1 &&
        Number.isInteger(item.quantity) && item.quantity >= 1,
    )
    .map(({ productId, title, price, stock, quantity }) => ({
      productId, title, price, stock, quantity: clamp({ stock }, quantity),
    }))
}
