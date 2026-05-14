import apiClient from '@/services/apiClient'
import type { Distribucion, DistribucionDetail } from '@/types'

interface DistribucionFilters {
  edicion_dataset_id?: string | null
}

export async function getDistribuciones(filters: DistribucionFilters = {}): Promise<Distribucion[]> {
  const params: Record<string, string> = {}
  if (filters.edicion_dataset_id) params.edicion_dataset_id = filters.edicion_dataset_id
  const { data } = await apiClient.get<Distribucion[]>('/distribuciones/', { params })
  return data
}

export async function getDistribucion(id: string): Promise<DistribucionDetail> {
  const { data } = await apiClient.get<DistribucionDetail>(`/distribuciones/${id}`)
  return data
}

export async function createDistribucion(payload: {
  edicion_dataset_id?: string
  descriptor?: string
  url?: string
  requiere_autenticacion?: boolean
  requiere_registro?: boolean
  es_url_persistente?: boolean
  estado_url_ultima_revision?: string
  observaciones_distribucion?: string
}): Promise<Distribucion> {
  const { data } = await apiClient.post<Distribucion>('/distribuciones/', payload)
  return data
}

export async function updateDistribucion(id: string, payload: { descriptor?: string; url?: string; edicion_dataset_id?: string; requiere_autenticacion?: boolean; requiere_registro?: boolean; es_url_persistente?: boolean; estado_url_ultima_revision?: string; observaciones_distribucion?: string }): Promise<Distribucion> {
  const { data } = await apiClient.put<Distribucion>(`/distribuciones/${id}`, payload)
  return data
}

export async function deleteDistribucion(id: string): Promise<void> {
  await apiClient.delete(`/distribuciones/${id}`)
}
