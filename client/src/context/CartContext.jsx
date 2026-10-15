import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchProduct } from '../api/products'
import { useAuth } from '../hooks/useAuth'
import * as cart from '../utils/cart'
import { CartContext } from './cartContext'

const storageKey = (userId) => `cart:${userId}`

const readStored = (userId) => {
  try {
    return cart.sanitize(JSON.parse(localStorage.getItem(storageKey(userId))))
  } catch {
    return []
  }
}

const loadLatest = async ({ productId }) => {
  try {
    return [productId, await fetchProduct(productId)]
  } catch (error) {
    return error.response?.status === 404 ? [productId, null] : null
  }
}

function CartStore({ userId, children }) {
  const [items, setItems] = useState(() => (userId ? readStored(userId) : []))
  const itemsRef = useRef(items)

  // The cart is kept per account in this browser; the server only ever sees it at checkout.
  useEffect(() => {
    itemsRef.current = items
    if (!userId) return
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(items))
    } catch {
      // Storage can be blocked or full; the cart still works for this page view.
    }
  }, [items, userId])

  const addToCart = useCallback((product, quantity) => setItems((prev) => cart.addItem(prev, product, quantity)), [])
  const updateQuantity = useCallback((id, quantity) => setItems((prev) => cart.setQuantity(prev, id, quantity)), [])
  const removeFromCart = useCallback((id) => setItems((prev) => cart.removeItem(prev, id)), [])
  const clearCart = useCallback(() => setItems([]), [])

  // Re-reads price and stock for every line so the cart never shows stale numbers.
  const refreshCart = useCallback(async () => {
    const latest = Object.fromEntries((await Promise.all(itemsRef.current.map(loadLatest))).filter(Boolean))
    setItems((prev) => cart.applyLatest(prev, latest))
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount: cart.countItems(items),
      total: cart.cartTotal(items),
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
    }),
    [items, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Keyed by user so logging in or out swaps in that account's cart instead of leaking the previous one.
export function CartProvider({ children }) {
  const { user } = useAuth()
  return <CartStore key={user?._id ?? 'guest'} userId={user?._id}>{children}</CartStore>
}
