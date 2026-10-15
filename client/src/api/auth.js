import api from './axios'

// A 401 from these calls is an expected outcome (bad credentials, no session yet), not an expired session.
const expected401 = { skipUnauthorizedHandler: true }

export const registerUser = (data) => api.post('/auth/register', data, expected401).then((res) => res.data.user)
export const loginUser = (data) => api.post('/auth/login', data, expected401).then((res) => res.data.user)
export const logoutUser = () => api.post('/auth/logout')
export const fetchCurrentUser = () => api.get('/auth/me', expected401).then((res) => res.data.user)
