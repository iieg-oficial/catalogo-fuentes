import apiClient from '@/services/apiClient'
import type { Rol } from '@/types'

export async function getRoles(): Promise<Rol[]> {
  const { data } = await apiClient.get<Rol[]>('/roles/')
  return data
}
