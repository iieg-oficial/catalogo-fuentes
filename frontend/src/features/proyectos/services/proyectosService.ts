import apiClient from '@/services/apiClient'
import type { Proyecto, ProyectoDetail } from '@/types'

export async function getProyectos(): Promise<Proyecto[]> {
  const { data } = await apiClient.get<Proyecto[]>('/proyectos/')
  return data
}

export async function getProyecto(id: string): Promise<ProyectoDetail> {
  const { data } = await apiClient.get<ProyectoDetail>(`/proyectos/${id}`)
  return data
}

export async function createProyecto(payload: { nombre: string; descripcion?: string }): Promise<Proyecto> {
  const { data } = await apiClient.post<Proyecto>('/proyectos/', payload)
  return data
}

export async function updateProyecto(id: string, payload: { meta?: Record<string, unknown> }): Promise<Proyecto> {
  const { data } = await apiClient.put<Proyecto>(`/proyectos/${id}`, payload)
  return data
}

export async function deleteProyecto(id: string): Promise<void> {
  await apiClient.delete(`/proyectos/${id}`)
}
