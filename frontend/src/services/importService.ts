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

export interface ImportDetalleOmitido {
  fila: number
  clave: string
  motivo: string
}

export interface ImportResult {
  creados: number
  omitidos_duplicados: number
  detalle_omitidos: ImportDetalleOmitido[]
}

export interface ImportErrorDetail {
  bloqueado: true
  mensaje: string
  fila: number | null
}

export async function importCsv(entidad: EntidadImportable, file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<ImportResult>(`/import/${entidad}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
