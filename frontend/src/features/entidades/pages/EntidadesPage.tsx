import { useEffect, useRef, useState } from 'react'
import Topbar from '@/components/Topbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { getEntidadesErd } from '../services/entidadesService'

type ExportFormat = 'html' | 'svg' | 'png'

const btnCls =
  'px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'

export default function EntidadesPage() {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('html')
  const [frameReady, setFrameReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const load = async () => {
    setLoading(true)
    setError(false)
    setFrameReady(false)
    try {
      setHtml(await getEntidadesErd())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // El iframe usa srcDoc (mismo origen), por lo que se accede a sus funciones.
  const callDiagram = (fn: 'exportDiagram' | 'resetLayout') => {
    const win = iframeRef.current?.contentWindow as (Window & Record<string, () => void>) | null
    if (fn === 'exportDiagram') {
      const select = iframeRef.current?.contentDocument?.getElementById('exportFmt') as HTMLSelectElement | null
      if (select) select.value = format
    }
    win?.[fn]?.()
  }

  const actions = html && frameReady ? (
    <div className="flex items-center gap-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
        aria-label="Formato de exportación"
        className={btnCls}
      >
        <option value="html">HTML</option>
        <option value="svg">SVG</option>
        <option value="png">PNG</option>
      </select>
      <button onClick={() => callDiagram('exportDiagram')} className={btnCls}>
        Exportar
      </button>
      <button onClick={() => callDiagram('resetLayout')} className={btnCls}>
        Restablecer
      </button>
    </div>
  ) : undefined

  return (
    <>
      <Topbar title="Entidades" actions={actions} />
      <div className="flex-1 min-h-0 bg-neutral-50">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <ErrorState onRetry={load} />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Diagrama de entidades"
            srcDoc={html ?? ''}
            onLoad={() => setFrameReady(true)}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </>
  )
}
