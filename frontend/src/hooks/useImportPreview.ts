import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import {
  importCsv,
  previewImportCsv,
  type EntidadImportable,
  type ImportErrorDetail,
  type ImportResult,
} from '@/services/importService'

const MENSAJE_SIN_PERMISO = 'No tenés permiso para importar registros.'
const MENSAJE_ENTIDAD_DESCONOCIDA = 'La entidad indicada no admite importación.'
const MENSAJE_ERROR_GENERICO = 'No se pudo importar el archivo. Intentá de nuevo.'

function resolveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 403) return MENSAJE_SIN_PERMISO
    if (status === 404) return MENSAJE_ENTIDAD_DESCONOCIDA
    const detail = error.response?.data?.detail as ImportErrorDetail | undefined
    if (detail?.mensaje) return detail.mensaje
  }
  return MENSAJE_ERROR_GENERICO
}

export interface UseImportPreview<T> {
  loading: boolean
  previewRows: T[]
  duplicadosPreview: number
  bloqueo: string | null
  active: boolean
  resultado: ImportResult | null
  requestPreview: (file: File) => Promise<void>
  confirm: () => Promise<void>
  cancel: () => void
  clearResultado: () => void
}

/**
 * Encapsula el flujo de previsualización + confirmación de un import CSV.
 *
 * Al seleccionar un archivo, ejecuta el dry-run (`previewImportCsv`) y expone
 * las filas que se crearían (`previewRows`), la cantidad que se omitirían por
 * duplicado (`duplicadosPreview`) o un mensaje de bloqueo (`bloqueo`).
 * `confirm` reenvía el mismo archivo al import real (`importCsv`), expone el
 * resultado (`resultado`) para que la vista muestre feedback de éxito, dispara
 * `onDone` y limpia el estado de preview. `cancel` limpia sin llamar al
 * backend.
 *
 * `requestPreview` descarta respuestas que ya no corresponden a la última
 * selección de archivo (guard de secuencia por `requestId`), para evitar que
 * una respuesta tardía de un archivo previo pise la selección más reciente.
 */
export function useImportPreview<T = Record<string, unknown>>(
  entidad: EntidadImportable,
  onDone: () => void,
): UseImportPreview<T> {
  const [loading, setLoading] = useState(false)
  const [previewRows, setPreviewRows] = useState<T[]>([])
  const [duplicadosPreview, setDuplicadosPreview] = useState(0)
  const [bloqueo, setBloqueo] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [resultado, setResultado] = useState<ImportResult | null>(null)
  const requestIdRef = useRef(0)

  const reset = () => {
    setPreviewRows([])
    setDuplicadosPreview(0)
    setBloqueo(null)
    setPendingFile(null)
  }

  const requestPreview = async (file: File) => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setBloqueo(null)
    setPreviewRows([])
    setDuplicadosPreview(0)
    try {
      const result = await previewImportCsv(entidad, file)
      if (requestId !== requestIdRef.current) return
      setPreviewRows(result.a_crear.map((row) => row.datos as T))
      setDuplicadosPreview(result.omitidos_duplicados.length)
      setPendingFile(file)
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setBloqueo(resolveErrorMessage(error))
      setPendingFile(file)
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  const confirm = async () => {
    if (!pendingFile || bloqueo) return
    setLoading(true)
    try {
      const result = await importCsv(entidad, pendingFile)
      reset()
      setResultado(result)
      onDone()
    } catch (error) {
      setBloqueo(resolveErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const cancel = () => reset()

  const clearResultado = () => setResultado(null)

  return {
    loading,
    previewRows,
    duplicadosPreview,
    bloqueo,
    active: previewRows.length > 0 || !!bloqueo,
    resultado,
    requestPreview,
    confirm,
    cancel,
    clearResultado,
  }
}
