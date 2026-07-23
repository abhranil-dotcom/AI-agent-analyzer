import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AUTH_TOKEN_STORAGE_KEY, fetchCurrentUser, login as loginRequest, signup as signupRequest } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    setUser(null)
  }, [])

  // Validate any stored token on load so a refresh doesn't log the user out, and so an
  // expired/invalid token is caught before protected routes render.
  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }

    fetchCurrentUser()
      .then((data) => setUser(data))
      .catch(() => window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY))
      .finally(() => setIsLoading(false))
  }, [])

  // The axios interceptor dispatches this on any 401 response — react-router-agnostic way to
  // react from a non-component module.
  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout)
    return () => window.removeEventListener('auth:unauthorized', logout)
  }, [logout])

  async function signup(email, password) {
    const data = await signupRequest(email, password)
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token)
    setUser(data.user)
  }

  async function login(email, password) {
    const data = await loginRequest(email, password)
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token)
    setUser(data.user)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signup, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
