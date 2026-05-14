import apiClient from '@/services/apiClient'
import type { Archivo } from '@/types'

interface ArchivoFilters {
  distribucion_id?: string | null
}

export async function getArchivos(filters: ArchivoFilters = {}): Promise<Archivo[]> {
  const params: Record<string, string> = {}
  if (filters.distribucion_id) params.distribucion_id = filters.distribucion_id
  const { data } = await apiClient.get<Archivo[]>('/archivos/', { params })
  return data
}

export async function getArchivo(id: string): Promise<Archivo> {
  const { data } = await apiClient.get<Archivo>(`/archivos/${id}`)
  return data
}

export async function createArchivo(payload: {
  nombre_archivo: string
  distribucion_id?: string
  rol_archivo?: string
  observaciones_archivo?: string
}): Promise<Archivo> {
  const { data } = await apiClient.post<Archivo>('/archivos/', payload)
  return data
}

export async function updateArchivo(id: string, payload: { nombre_archivo?: string; rol_archivo?: string; observaciones_archivo?: string; distribucion_id?: string }): Promise<Archivo> {
  const { data } = await apiClient.put<Archivo>(`/archivos/${id}`, payload)
  return data
}

export async function deleteArchivo(id: string): Promise<void> {
  await apiClient.delete(`/archivos/${id}`)
}
