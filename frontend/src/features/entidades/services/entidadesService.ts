import apiClient from '@/services/apiClient'

export async function getEntidadesErd(): Promise<string> {
  const { data } = await apiClient.get<string>('/entidades/erd', { responseType: 'text' })
  return data
}
