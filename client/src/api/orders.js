import api from './axios'

export const checkoutOrder = (data) => api.post('/orders/checkout', data).then((res) => res.data.order)
export const fetchOrders = (params) => api.get('/orders', { params }).then((res) => res.data)
