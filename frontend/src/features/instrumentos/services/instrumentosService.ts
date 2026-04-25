import apiClient from '@/services/apiClient'
import type { Instrumento, InstrumentoDetail } from '@/types'

export async function getInstrumentos(baseDeDatosId?: string | null): Promise<Instrumento[]> {
  const params = baseDeDatosId ? { base_de_datos_id: baseDeDatosId } : {}
  const { data } = await apiClient.get<Instrumento[]>('/instrumentos/', { params })
  return data
}

export async function getInstrumento(id: string): Promise<InstrumentoDetail> {
  const { data } = await apiClient.get<InstrumentoDetail>(`/instrumentos/${id}`)
  return data
}

export async function createInstrumento(payload: {
  nombre: string
  base_de_datos_id: string
  descripcion?: string
  fecha_publicacion?: string
}): Promise<Instrumento> {
  const { data } = await apiClient.post<Instrumento>('/instrumentos/', payload)
  return data
}

export async function updateInstrumento(id: string, payload: { nombre?: string; descripcion?: string; base_de_datos_id?: string; meta?: Record<string, unknown> }): Promise<Instrumento> {
  const { data } = await apiClient.put<Instrumento>(`/instrumentos/${id}`, payload)
  return data
}

export async function deleteInstrumento(id: string): Promise<void> {
  await apiClient.delete(`/instrumentos/${id}`)
}
