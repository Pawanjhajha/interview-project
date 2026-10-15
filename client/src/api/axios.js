import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  withCredentials: true,
})

// Set by AuthProvider so an expired or revoked session anywhere in the app logs the user out in the UI.
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login, register and the startup session check expect 401s, so they opt out.
    if (error.response?.status === 401 && !error.config?.skipUnauthorizedHandler) onUnauthorized()
    return Promise.reject(error)
  },
)

export default api
