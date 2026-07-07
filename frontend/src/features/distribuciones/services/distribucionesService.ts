import apiClient from '@/services/apiClient'
import type { Distribucion, DistribucionDetail, TipoDeAcceso } from '@/types'

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
  dataset_id?: string
  tipo_de_acceso_id?: string
  distribucion?: string
  url?: string
  requiere_control_de_acceso?: boolean
  es_url_persistente?: boolean
  observaciones_distribucion?: string
}): Promise<Distribucion> {
  const { data } = await apiClient.post<Distribucion>('/distribuciones/', payload)
  return data
}

export async function updateDistribucion(id: string, payload: { distribucion?: string; url?: string; edicion_dataset_id?: string; dataset_id?: string; tipo_de_acceso_id?: string; requiere_control_de_acceso?: boolean; es_url_persistente?: boolean; observaciones_distribucion?: string }): Promise<Distribucion> {
  const { data } = await apiClient.put<Distribucion>(`/distribuciones/${id}`, payload)
  return data
}

export async function deleteDistribucion(id: string): Promise<void> {
  await apiClient.delete(`/distribuciones/${id}`)
}

export async function getTiposDeAcceso(): Promise<TipoDeAcceso[]> {
  const { data } = await apiClient.get<TipoDeAcceso[]>('/tipos-de-acceso/')
  return data
}

