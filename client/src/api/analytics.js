import api from './axios'

export const fetchSalesReport = (params) => api.get('/merchant/analytics', { params }).then((res) => res.data)
