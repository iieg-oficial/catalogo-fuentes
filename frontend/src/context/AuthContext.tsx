import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Usuario } from '@/types'

interface AuthContextValue {
  user: Usuario | null
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
  const canWrite = user?.rol?.nombre === 'admin' || user?.rol?.nombre === 'maintainer' || user?.rol?.nombre === 'superadmin'
  const canManageUsers = user?.rol?.nombre === 'admin' || user?.rol?.nombre === 'superadmin'
  const isSuperAdmin = user?.rol?.nombre === 'superadmin'
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
