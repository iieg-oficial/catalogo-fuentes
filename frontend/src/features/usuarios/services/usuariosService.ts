import apiClient from '@/services/apiClient'
import type { Usuario } from '@/types'

export async function getUsuarios(): Promise<Usuario[]> {
  const { data } = await apiClient.get<Usuario[]>('/usuarios/')
  return data
}

export async function getUsuario(id: string): Promise<Usuario> {
  const { data } = await apiClient.get<Usuario>(`/usuarios/${id}`)
  return data
}

export async function createUsuario(payload: { correo: string; nombre?: string; rol_id?: string }): Promise<Usuario> {
  const { data } = await apiClient.post<Usuario>('/usuarios/', payload)
  return data
}

export async function updateUsuario(id: string, payload: { nombre?: string; activo?: boolean; rol_id?: string }): Promise<Usuario> {
  const { data } = await apiClient.put<Usuario>(`/usuarios/${id}`, payload)
  return data
}

export async function deleteUsuario(id: string): Promise<void> {
  await apiClient.delete(`/usuarios/${id}`)
}
