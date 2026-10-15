import { useCallback, useRef, useState } from 'react'
import { checkoutOrder } from '../api/orders'
import { toCheckoutItems } from '../utils/cart'
import { createId } from '../utils/createId'
import { useCart } from './useCart'

/**
 * Submits the cart. One checkout id is reused while the cart is unchanged, so a retry after a lost
 * response (or a double click) returns the same order instead of buying twice.
 */
export function useCheckout() {
  const { items, clearCart, refreshCart } = useCart()
  const [state, setState] = useState({ isSubmitting: false, error: null, order: null })
  const attempt = useRef({ signature: '', id: '' })
  const inFlight = useRef(false)

  const submit = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    const payload = toCheckoutItems(items)
    const signature = JSON.stringify(payload)
    if (attempt.current.signature !== signature) attempt.current = { signature, id: createId() }

    setState({ isSubmitting: true, error: null, order: null })
    try {
      const order = await checkoutOrder({ checkoutId: attempt.current.id, items: payload })
      clearCart()
      setState({ isSubmitting: false, error: null, order })
    } catch (error) {
      setState({ isSubmitting: false, error, order: null })
      await refreshCart() // show the stock and prices the server just rejected against
    } finally {
      inFlight.current = false
    }
  }, [items, clearCart, refreshCart])

  return { ...state, submit }
}
