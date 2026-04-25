import apiClient from './apiClient'

interface MetaColumnConfigResponse {
  entity_type: string
  config: Record<string, unknown>
}

export async function getMetaColumns(entityType: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<MetaColumnConfigResponse>(`/meta-columns/${entityType}`)
  return data.config
}

export async function saveMetaColumns(entityType: string, config: Record<string, unknown>): Promise<void> {
  await apiClient.put(`/meta-columns/${entityType}`, { config })
}
