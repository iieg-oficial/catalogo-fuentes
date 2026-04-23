import apiClient from '@/services/apiClient'
import type { Url, UrlDetail } from '@/types'

export async function getUrls(instrumentoId?: string | null): Promise<Url[]> {
  const params = instrumentoId ? { instrumento_id: instrumentoId } : {}
  const { data } = await apiClient.get<Url[]>('/urls/', { params })
  return data
}

export async function getUrl(id: string): Promise<UrlDetail> {
  const { data } = await apiClient.get<UrlDetail>(`/urls/${id}`)
  return data
}

export async function createUrl(payload: {
  url: string
  instrumento_id: string
}): Promise<Url> {
  const { data } = await apiClient.post<Url>('/urls/', payload)
  return data
}

export async function updateUrl(id: string, payload: { meta?: Record<string, unknown> }): Promise<Url> {
  const { data } = await apiClient.put<Url>(`/urls/${id}`, payload)
  return data
}

export async function deleteUrl(id: string): Promise<void> {
  await apiClient.delete(`/urls/${id}`)
}
