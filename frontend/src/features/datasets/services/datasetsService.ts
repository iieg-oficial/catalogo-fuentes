import apiClient from '@/services/apiClient'
import type { Dataset, DatasetDetail } from '@/types'

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
  identificador_persistente?: string
  descripcion?: string
  periodicidad?: string
  vigente?: boolean
  tema_principal?: string
  proposito?: string
  observaciones_dataset?: string
  fuente_id?: string
  url_pagina_principal?: string
  url_metodologia_general?: string
  url_metadatos_general?: string
  url_normativa_o_marco_legal?: string
  desagregacion_geografica?: string
  cobertura_temporal_general?: string
  unidad_observacion?: string
  fecha_inicio_disponibilidad?: string
  fecha_fin_disponibilidad?: string
  etiquetas?: unknown[]
}): Promise<Dataset> {
  const { data } = await apiClient.post<Dataset>('/datasets/', payload)
  return data
}

export async function updateDataset(id: string, payload: {
  nombre?: string
  descripcion?: string
  fuente_id?: string
  periodicidad?: string
  tema_principal?: string
  nombre_corto?: string
  identificador_persistente?: string
  url_pagina_principal?: string
  url_metodologia_general?: string
  url_metadatos_general?: string
  desagregacion_geografica?: string
  cobertura_temporal_general?: string
  unidad_observacion?: string
  proposito?: string
  observaciones_dataset?: string
  url_normativa_o_marco_legal?: string
  vigente?: boolean
  fecha_inicio_disponibilidad?: string
  fecha_fin_disponibilidad?: string
  etiquetas?: Record<string, unknown>
}): Promise<Dataset> {
  const { data } = await apiClient.put<Dataset>(`/datasets/${id}`, payload)
  return data
}

export async function deleteDataset(id: string): Promise<void> {
  await apiClient.delete(`/datasets/${id}`)
}
