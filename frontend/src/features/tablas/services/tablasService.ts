import apiClient from '@/services/apiClient'
import type { Tabla } from '@/types'

interface TablaFilters {
  proyecto_id?: string | null
  producto_id?: string | null
  base_de_datos_id?: string | null
}

export async function getTablas(filters: TablaFilters = {}): Promise<Tabla[]> {
  const params: Record<string, string> = {}
  if (filters.proyecto_id) params.proyecto_id = filters.proyecto_id
  if (filters.producto_id) params.producto_id = filters.producto_id
  if (filters.base_de_datos_id) params.base_de_datos_id = filters.base_de_datos_id
  const { data } = await apiClient.get<Tabla[]>('/tablas/', { params })
  return data
}

export async function getTabla(id: string): Promise<Tabla> {
  const { data } = await apiClient.get<Tabla>(`/tablas/${id}`)
  return data
}

export async function createTabla(payload: {
  nombre: string
  base_de_datos_id: string
  campos?: Array<Record<string, unknown>>
  producto_ids?: string[]
}): Promise<Tabla> {
  const { data } = await apiClient.post<Tabla>('/tablas/', payload)
  return data
}

export async function updateTabla(id: string, payload: {
  nombre?: string
  campos?: Array<Record<string, unknown>>
  producto_ids?: string[]
  base_de_datos_id?: string
  meta?: Record<string, unknown>
}): Promise<Tabla> {
  const { data } = await apiClient.put<Tabla>(`/tablas/${id}`, payload)
  return data
}

export async function deleteTabla(id: string): Promise<void> {
  await apiClient.delete(`/tablas/${id}`)
}
