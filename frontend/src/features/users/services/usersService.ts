import apiClient from '@/services/apiClient'
import type { User, UserRole } from '@/types'

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users/')
  return data
}

export async function createUser(email: string, password: string, role: UserRole): Promise<User> {
  const { data } = await apiClient.post<User>('/users/', { email, password, role })
  return data
}

export async function updateUser(id: string, updates: { role?: UserRole; is_active?: boolean }): Promise<User> {
  const { data } = await apiClient.put<User>(`/users/${id}`, updates)
  return data
}
