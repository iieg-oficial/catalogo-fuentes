import apiClient from '@/services/apiClient'
import type { BaseDeDatos, BaseDeDatosDetail } from '@/types'

interface BdFilters {
  tabla_id?: string | null
  producto_id?: string | null
  proyecto_id?: string | null
}

export async function getBasesDeDatos(filters: BdFilters = {}): Promise<BaseDeDatos[]> {
  const params: Record<string, string> = {}
  if (filters.tabla_id) params.tabla_id = filters.tabla_id
  if (filters.producto_id) params.producto_id = filters.producto_id
  if (filters.proyecto_id) params.proyecto_id = filters.proyecto_id
  const { data } = await apiClient.get<BaseDeDatos[]>('/bases-de-datos/', { params })
  return data
}

export async function getBaseDeDatos(id: string): Promise<BaseDeDatosDetail> {
  const { data } = await apiClient.get<BaseDeDatosDetail>(`/bases-de-datos/${id}`)
  return data
}

export async function createBaseDeDatos(payload: {
  nombre: string
  descripcion?: string
  tema?: string
  frecuencia_actualizacion?: string
}): Promise<BaseDeDatos> {
  const { data } = await apiClient.post<BaseDeDatos>('/bases-de-datos/', payload)
  return data
}

export async function updateBaseDeDatos(id: string, payload: { nombre?: string; descripcion?: string; tema?: string; frecuencia_actualizacion?: string; meta?: Record<string, unknown> }): Promise<BaseDeDatos> {
  const { data } = await apiClient.put<BaseDeDatos>(`/bases-de-datos/${id}`, payload)
  return data
}

export async function deleteBaseDeDatos(id: string): Promise<void> {
  await apiClient.delete(`/bases-de-datos/${id}`)
}
