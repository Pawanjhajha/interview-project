import api from './axios'

export const fetchReviews = (productId, params) => api.get(`/products/${productId}/reviews`, { params }).then((res) => res.data)
export const createReview = (productId, data) => api.post(`/products/${productId}/reviews`, data).then((res) => res.data.review)
