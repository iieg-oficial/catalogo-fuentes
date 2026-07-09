import apiClient from '@/services/apiClient'

export type EntidadImportable =
  | 'proyecto'
  | 'producto'
  | 'fuente'
  | 'dataset'
  | 'edicion_dataset'
  | 'distribucion'
  | 'archivo'
  | 'base_de_datos'
  | 'informacion_tablas'

export interface ImportSkipped {
  fila: number
  clave: string
  motivo: string
}

export interface ImportResult {
  entidad: string
  creados: number
  omitidos_duplicados: ImportSkipped[]
}

export interface ImportErrorDetail {
  bloqueado: true
  mensaje: string
  fila: number | null
}

export interface ImportPreviewRow {
  fila: number
  datos: Record<string, unknown>
}

export interface ImportPreviewResult {
  entidad: string
  a_crear: ImportPreviewRow[]
  omitidos_duplicados: ImportSkipped[]
}

export async function importCsv(entidad: EntidadImportable, file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<ImportResult>(`/import/${entidad}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function previewImportCsv(entidad: EntidadImportable, file: File): Promise<ImportPreviewResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<ImportPreviewResult>(`/import/${entidad}/preview`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
