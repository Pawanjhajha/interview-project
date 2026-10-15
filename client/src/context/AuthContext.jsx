import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { setUnauthorizedHandler } from '../api/axios'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Single source of truth for "who am I": asks the server (the httpOnly cookie is the session).
  // Concurrent callers share one request, which also stops StrictMode's double effect in dev
  // from hitting /me twice. Only a 401 clears the user, so a network blip never logs anyone out.
  const pendingRefresh = useRef(null)
  const refreshUser = useCallback(() => {
    if (!pendingRefresh.current) {
      pendingRefresh.current = authApi
        .fetchCurrentUser()
        .then(setUser)
        .catch((error) => {
          if (error.response?.status === 401) setUser(null)
        })
        .finally(() => {
          pendingRefresh.current = null
        })
    }
    return pendingRefresh.current
  }, [])

  // Restore the session on first load.
  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false))
  }, [refreshUser])

  // Any later 401 means the session expired or was revoked: drop the user so route guards redirect.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setSessionExpired(true)
    })
    return () => setUnauthorizedHandler(() => {})
  }, [])

  const startSession = useCallback((nextUser) => {
    setSessionExpired(false)
    setUser(nextUser)
  }, [])

  const login = useCallback(async (credentials) => startSession(await authApi.loginUser(credentials)), [startSession])
  const register = useCallback(async (data) => startSession(await authApi.registerUser(data)), [startSession])
  const logout = useCallback(async () => {
    try {
      await authApi.logoutUser()
    } finally {
      setSessionExpired(false)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, sessionExpired, isAuthenticated: Boolean(user), login, register, logout, refreshUser }),
    [user, isLoading, sessionExpired, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
