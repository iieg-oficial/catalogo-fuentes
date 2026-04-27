import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  canWrite: boolean
  canManageUsers: boolean
  isSuperAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, login, logout } = useAuth()
  const canWrite = user?.role === 'admin' || user?.role === 'maintainer' || user?.role === 'superadmin'
  const canManageUsers = user?.role === 'admin' || user?.role === 'superadmin'
  const isSuperAdmin = user?.role === 'superadmin'
  return (
    <AuthContext.Provider value={{ user, loading, canWrite, canManageUsers, isSuperAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider')
  return ctx
}
