import { useRef } from 'react'
import Button from './Button'
import type { EntidadImportable } from '@/services/importService'

interface ImportCsvButtonProps {
  entidad: EntidadImportable
  onFileSelected: (file: File) => void
  loading?: boolean
  label?: string
}

export default function ImportCsvButton({
  entidad,
  onFileSelected,
  loading = false,
  label = 'Importar CSV',
}: ImportCsvButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePick = () => inputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    onFileSelected(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        aria-label={`Seleccionar archivo CSV para importar ${entidad}`}
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
    </>
  )
}
