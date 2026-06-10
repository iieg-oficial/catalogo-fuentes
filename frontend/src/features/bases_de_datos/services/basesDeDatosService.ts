import apiClient from '@/services/apiClient'
import type { BaseDeDatos, BaseDeDatosDetail } from '@/types'

interface BdFilters {
  archivo_id?: string | null
}

export async function getBasesDeDatos(filters: BdFilters = {}): Promise<BaseDeDatos[]> {
  const params: Record<string, string> = {}
  if (filters.archivo_id) params.archivo_id = filters.archivo_id
  const { data } = await apiClient.get<BaseDeDatos[]>('/bases-de-datos/', { params })
  return data
}

export async function getBaseDeDatos(id: string): Promise<BaseDeDatosDetail> {
  const { data } = await apiClient.get<BaseDeDatosDetail>(`/bases-de-datos/${id}`)
  return data
}

export async function createBaseDeDatos(payload: {
  db_nombre: string
  archivo_id?: string
  descripcion_esquema?: Record<string, unknown>
  etiquetas?: Record<string, unknown>
}): Promise<BaseDeDatos> {
  const { data } = await apiClient.post<BaseDeDatos>('/bases-de-datos/', payload)
  return data
}

export async function updateBaseDeDatos(id: string, payload: { db_nombre?: string; descripcion_esquema?: Record<string, unknown>; etiquetas?: Record<string, unknown>; archivo_id?: string }): Promise<BaseDeDatos> {
  const { data } = await apiClient.put<BaseDeDatos>(`/bases-de-datos/${id}`, payload)
  return data
}

export async function deleteBaseDeDatos(id: string): Promise<void> {
  await apiClient.delete(`/bases-de-datos/${id}`)
}
