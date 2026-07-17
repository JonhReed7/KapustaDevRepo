import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  setToken,
  clearToken,
  setOnUnauthorized,
  type User,
} from '@/api/client'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try { return localStorage.getItem('kapusta_token') } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setAuthToken(null)
    clearToken()
  }, [])

  useEffect(() => {
    setOnUnauthorized(logout)
  }, [logout])

  // Restore session on mount
  useEffect(() => {
    if (!authToken) {
      setLoading(false)
      return
    }
    setToken(authToken)
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        setUser(null)
        setAuthToken(null)
        clearToken()
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    setAuthToken(data.access_token)
    setToken(data.access_token)
    const me = await getCurrentUser()
    setUser(me)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    await apiRegister(email, password, name)
    const data = await apiLogin(email, password)
    setAuthToken(data.access_token)
    setToken(data.access_token)
    const me = await getCurrentUser()
    setUser(me)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token: authToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
