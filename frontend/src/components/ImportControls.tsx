import Button from './Button'
import ImportCsvButton from './ImportCsvButton'
import Toast from './Toast'
import type { UseImportPreview } from '@/hooks/useImportPreview'
import type { EntidadImportable } from '@/services/importService'

interface ImportControlsProps {
  preview: UseImportPreview<unknown>
  entidad: EntidadImportable
}

/**
 * Encapsula la UI de importación/previsualización de CSV: la barra del
 * toolbar (conteo + botón "Importar CSV"), la ventana flotante de
 * confirmación/cancelación y el toast de resultado.
 *
 * Se usa en el `importSlot` de `CatalogGrid` para evitar duplicar este
 * bloque en cada página que soporta importación.
 */
export default function ImportControls({ preview, entidad }: ImportControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <ImportCsvButton entidad={entidad} loading={preview.loading} onFileSelected={preview.requestPreview} />

      {preview.active && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 px-4 py-3 bg-white rounded-lg shadow-lg border border-ink/[8%]">
          {preview.bloqueo ? (
            <p className="text-[13px] text-error-600">{preview.bloqueo}</p>
          ) : (
            <span className="text-[12px] text-ink/50">
              {preview.previewRows.length} a crear, {preview.duplicadosPreview} se omitirían por duplicado
            </span>
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-accent hover:bg-accent-hover text-white"
              onClick={preview.confirm}
              disabled={!!preview.bloqueo || preview.loading}
            >
              Confirmar
            </Button>
            <Button size="sm" variant="secondary" onClick={preview.cancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {preview.resultado && (
        <Toast
          message={`${preview.resultado.creados} creados, ${preview.resultado.omitidos_duplicados.length} omitidos por duplicado`}
          variant="success"
          onClose={preview.clearResultado}
        />
      )}
    </div>
  )
}
