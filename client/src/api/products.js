import api from './axios'

export const fetchProducts = (params) => api.get('/products', { params }).then((res) => res.data)
export const fetchProduct = (id) => api.get(`/products/${id}`).then((res) => res.data.product)
export const fetchMyProducts = () => api.get('/products/mine').then((res) => res.data.products)
export const createProduct = (data) => api.post('/products', data).then((res) => res.data.product)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then((res) => res.data.product)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
