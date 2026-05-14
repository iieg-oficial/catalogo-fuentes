import apiClient from '@/services/apiClient'
import type { Fuente, FuenteDetail } from '@/types'

export async function getFuentes(): Promise<Fuente[]> {
  const { data } = await apiClient.get<Fuente[]>('/fuentes/')
  return data
}

export async function getFuente(id: string): Promise<FuenteDetail> {
  const { data } = await apiClient.get<FuenteDetail>(`/fuentes/${id}`)
  return data
}

export async function createFuente(payload: {
  nombre: string
  nombre_corto?: string
  sector?: string
  ambito?: string
  url?: string
  descripcion?: string
  es_fuente_oficial?: boolean
  es_publicador?: boolean
  jurisdiccion?: string
  url_terminos_uso?: string
  url_aviso_privacidad?: string
  contacto_institucional?: string
}): Promise<Fuente> {
  const { data } = await apiClient.post<Fuente>('/fuentes/', payload)
  return data
}

export async function updateFuente(id: string, payload: {
  nombre?: string
  descripcion?: string
  nombre_corto?: string
  sector?: string
  ambito?: string
  url?: string
  es_fuente_oficial?: boolean
  es_publicador?: boolean
  jurisdiccion?: string
  url_terminos_uso?: string
  url_aviso_privacidad?: string
  contacto_institucional?: string
}): Promise<Fuente> {
  const { data } = await apiClient.put<Fuente>(`/fuentes/${id}`, payload)
  return data
}

export async function deleteFuente(id: string): Promise<void> {
  await apiClient.delete(`/fuentes/${id}`)
}
