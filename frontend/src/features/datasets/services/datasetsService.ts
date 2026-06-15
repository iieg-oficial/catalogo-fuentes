import apiClient from '@/services/apiClient'
import type { Dataset, DatasetDetail, TipoDataset } from '@/types'

interface DatasetFilters {
  fuente_id?: string | null
}

export async function getDatasets(filters: DatasetFilters = {}): Promise<Dataset[]> {
  const params: Record<string, string> = {}
  if (filters.fuente_id) params.fuente_id = filters.fuente_id
  const { data } = await apiClient.get<Dataset[]>('/datasets/', { params })
  return data
}

export async function getDataset(id: string): Promise<DatasetDetail> {
  const { data } = await apiClient.get<DatasetDetail>(`/datasets/${id}`)
  return data
}

export async function createDataset(payload: {
  nombre: string
  nombre_corto?: string
  url_persistente?: string
  descripcion?: string
  periodicidad?: string
  vigente?: boolean
  proposito?: string
  observaciones_dataset?: string
  fuente_id?: string
  tipo_dataset_id?: string
  url_normativa_o_marco_legal?: string
  desagregacion_geografica?: string
  inicio_cobertura_temporal?: string
  nomenclatura_edicion?: string
  url_terminos_uso?: string
  url_aviso_privacidad?: string
  etiquetas?: Record<string, unknown>
}): Promise<Dataset> {
  const { data } = await apiClient.post<Dataset>('/datasets/', payload)
  return data
}

export async function updateDataset(id: string, payload: {
  nombre?: string
  descripcion?: string
  fuente_id?: string
  tipo_dataset_id?: string
  periodicidad?: string
  nombre_corto?: string
  url_persistente?: string
  desagregacion_geografica?: string
  inicio_cobertura_temporal?: string
  proposito?: string
  observaciones_dataset?: string
  url_normativa_o_marco_legal?: string
  nomenclatura_edicion?: string
  url_terminos_uso?: string
  url_aviso_privacidad?: string
  vigente?: boolean
  etiquetas?: Record<string, unknown>
}): Promise<Dataset> {
  const { data } = await apiClient.put<Dataset>(`/datasets/${id}`, payload)
  return data
}

export async function deleteDataset(id: string): Promise<void> {
  await apiClient.delete(`/datasets/${id}`)
}

export async function getTiposDataset(): Promise<TipoDataset[]> {
  const { data } = await apiClient.get<TipoDataset[]>('/tipos-dataset/')
  return data
}

export async function createTipoDataset(payload: { nombre: string; descripcion?: string }): Promise<TipoDataset> {
  const { data } = await apiClient.post<TipoDataset>('/tipos-dataset/', payload)
  return data
}
