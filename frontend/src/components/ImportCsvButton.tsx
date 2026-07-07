import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import Button from './Button'
import Toast from './Toast'
import { importCsv, type EntidadImportable, type ImportErrorDetail } from '@/services/importService'

interface ImportCsvButtonProps {
  entidad: EntidadImportable
  onDone: () => void
  label?: string
}

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

export default function ImportCsvButton({ entidad, onDone, label = 'Importar CSV' }: ImportCsvButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const handlePick = () => inputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setLoading(true)
    try {
      const result = await importCsv(entidad, file)
      setToast({
        message: `${result.creados} creados, ${result.omitidos_duplicados} omitidos por duplicado`,
        variant: 'success',
      })
      onDone()
    } catch (error) {
      setToast({ message: resolveErrorMessage(error), variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Seleccionar archivo CSV"
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePick}
        loading={loading}
        icon={
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 10V2M4 5l3-3 3 3" />
            <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" />
          </svg>
        }
      >
        {label}
      </Button>
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </>
  )
}
