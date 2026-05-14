import apiClient from '@/services/apiClient'
import type { InformacionTablas } from '@/types'

interface InfoTablasFilters {
  base_de_datos_id?: string | null
}

export async function getInformacionTablas(filters: InfoTablasFilters = {}): Promise<InformacionTablas[]> {
  const params: Record<string, string> = {}
  if (filters.base_de_datos_id) params.base_de_datos_id = filters.base_de_datos_id
  const { data } = await apiClient.get<InformacionTablas[]>('/informacion-tablas/', { params })
  return data
}

export async function getInformacionTabla(id: string): Promise<InformacionTablas> {
  const { data } = await apiClient.get<InformacionTablas>(`/informacion-tablas/${id}`)
  return data
}

export async function createInformacionTabla(payload: {
  nombre: string
  base_de_datos_id?: string
  descripcion?: string
}): Promise<InformacionTablas> {
  const { data } = await apiClient.post<InformacionTablas>('/informacion-tablas/', payload)
  return data
}

export async function updateInformacionTabla(id: string, payload: { nombre?: string; descripcion?: string; meta?: Record<string, unknown>; base_de_datos_id?: string }): Promise<InformacionTablas> {
  const { data } = await apiClient.put<InformacionTablas>(`/informacion-tablas/${id}`, payload)
  return data
}

export async function deleteInformacionTabla(id: string): Promise<void> {
  await apiClient.delete(`/informacion-tablas/${id}`)
}
