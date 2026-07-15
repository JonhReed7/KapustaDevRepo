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
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)

  const logout = useCallback(() => {
    setUser(null)
    setTokenState(null)
    clearToken()
  }, [])

  useEffect(() => {
    setOnUnauthorized(logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    setTokenState(data.access_token)
    setToken(data.access_token)
    const me = await getCurrentUser()
    setUser(me)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    await apiRegister(email, password)
    const data = await apiLogin(email, password)
    setTokenState(data.access_token)
    setToken(data.access_token)
    const me = await getCurrentUser()
    setUser({ ...me, name })
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
