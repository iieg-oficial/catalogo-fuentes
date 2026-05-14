import apiClient from '@/services/apiClient'
import type { EdicionDataset, EdicionDatasetDetail } from '@/types'

interface EdicionFilters {
  dataset_id?: string | null
}

export async function getEdicionesDataset(filters: EdicionFilters = {}): Promise<EdicionDataset[]> {
  const params: Record<string, string> = {}
  if (filters.dataset_id) params.dataset_id = filters.dataset_id
  const { data } = await apiClient.get<EdicionDataset[]>('/ediciones-dataset/', { params })
  return data
}

export async function getEdicionDataset(id: string): Promise<EdicionDatasetDetail> {
  const { data } = await apiClient.get<EdicionDatasetDetail>(`/ediciones-dataset/${id}`)
  return data
}

export async function createEdicionDataset(payload: {
  nombre: string
  dataset_id?: string
  fecha_publicacion?: string
  periodo_referencia_inicio?: string
  periodo_referencia_fin?: string
  tipo_periodo_referencia?: string
  fecha_levantamiento_inicio?: string
  fecha_levantamiento_fin?: string
  url_documentacion_edicion?: string
  url_comunicado_publicacion?: string
  observaciones_edicion?: string
  version_publicacion?: string
  es_version_corregida?: boolean
}): Promise<EdicionDataset> {
  const { data } = await apiClient.post<EdicionDataset>('/ediciones-dataset/', payload)
  return data
}

export async function updateEdicionDataset(id: string, payload: { nombre?: string; dataset_id?: string; fecha_publicacion?: string; periodo_referencia_inicio?: string; periodo_referencia_fin?: string; tipo_periodo_referencia?: string; fecha_levantamiento_inicio?: string; fecha_levantamiento_fin?: string; url_documentacion_edicion?: string; url_comunicado_publicacion?: string; observaciones_edicion?: string; version_publicacion?: string; es_version_corregida?: boolean }): Promise<EdicionDataset> {
  const { data } = await apiClient.put<EdicionDataset>(`/ediciones-dataset/${id}`, payload)
  return data
}

export async function deleteEdicionDataset(id: string): Promise<void> {
  await apiClient.delete(`/ediciones-dataset/${id}`)
}
