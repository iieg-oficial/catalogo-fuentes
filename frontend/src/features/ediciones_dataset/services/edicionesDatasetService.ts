import apiClient from '@/services/apiClient'
import type { EdicionDataset, EdicionDatasetDetail, TipoPeriodo } from '@/types'

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
  edicion: string
  dataset_id?: string
  fecha_publicacion?: string
  periodo_referencia_inicio?: string
  periodo_referencia_fin?: string
  tipo_periodo_id?: string
  url_metodologia_edicion?: string
  url_metadatos_edicion?: string
  observaciones_edicion?: string
}): Promise<EdicionDataset> {
  const { data } = await apiClient.post<EdicionDataset>('/ediciones-dataset/', payload)
  return data
}

export async function updateEdicionDataset(id: string, payload: { edicion?: string; dataset_id?: string; fecha_publicacion?: string; periodo_referencia_inicio?: string; periodo_referencia_fin?: string; tipo_periodo_id?: string; url_metodologia_edicion?: string; url_metadatos_edicion?: string; observaciones_edicion?: string }): Promise<EdicionDataset> {
  const { data } = await apiClient.put<EdicionDataset>(`/ediciones-dataset/${id}`, payload)
  return data
}

export async function deleteEdicionDataset(id: string): Promise<void> {
  await apiClient.delete(`/ediciones-dataset/${id}`)
}

export async function getTiposPeriodo(): Promise<TipoPeriodo[]> {
  const { data } = await apiClient.get<TipoPeriodo[]>('/tipos-periodo/')
  return data
}

export async function createTipoPeriodo(payload: { nombre: string; descripcion?: string }): Promise<TipoPeriodo> {
  const { data } = await apiClient.post<TipoPeriodo>('/tipos-periodo/', payload)
  return data
}
