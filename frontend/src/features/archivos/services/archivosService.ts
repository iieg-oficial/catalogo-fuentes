import apiClient from '@/services/apiClient'
import type { Archivo } from '@/types'

interface ArchivoFilters {
  url_id?: string | null
  instrumento_id?: string | null
}

export async function getArchivos(filters: ArchivoFilters = {}): Promise<Archivo[]> {
  const params: Record<string, string> = {}
  if (filters.url_id) params.url_id = filters.url_id
  if (filters.instrumento_id) params.instrumento_id = filters.instrumento_id
  const { data } = await apiClient.get<Archivo[]>('/archivos/', { params })
  return data
}

export async function getArchivo(id: string): Promise<Archivo> {
  const { data } = await apiClient.get<Archivo>(`/archivos/${id}`)
  return data
}

export async function createArchivo(payload: {
  url_id: string
  descripcion?: string
  fecha_publicacion?: string
  fecha_fuente?: string
}): Promise<Archivo> {
  const { data } = await apiClient.post<Archivo>('/archivos/', payload)
  return data
}

export async function updateArchivo(id: string, payload: { descripcion?: string; fecha_publicacion?: string; meta?: Record<string, unknown> }): Promise<Archivo> {
  const { data } = await apiClient.put<Archivo>(`/archivos/${id}`, payload)
  return data
}

export async function deleteArchivo(id: string): Promise<void> {
  await apiClient.delete(`/archivos/${id}`)
}
