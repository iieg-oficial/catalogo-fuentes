import { useCallback, useEffect, useState } from 'react'
import { TOKEN_KEY } from '@/consts'
import type { Usuario } from '@/types'
import apiClient from '@/services/apiClient'

export function useAuth() {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await apiClient.get<Usuario>('/auth/me')
      setUser(data)
    } catch {
      localStorage.removeItem(TOKEN_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<{ access_token: string }>('/auth/login', {
      email,
      password,
    })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    await fetchMe()
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return { user, loading, login, logout, refreshUser: fetchMe }
}
