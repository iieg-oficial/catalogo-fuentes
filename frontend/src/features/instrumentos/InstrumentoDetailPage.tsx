import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import MetaSection from '@/components/MetaSection'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { InstrumentoDetail } from '@/types'
import { getInstrumento, updateInstrumento } from './services/instrumentosService'

export default function InstrumentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<InstrumentoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getInstrumento(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateInstrumento(id!, { meta: newMeta })
    setItem((prev) => prev ? { ...prev, meta: newMeta } : null)
  }

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  return (
    <>
      <Topbar
        title={item.nombre}
        actions={
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md">
            ← Volver
          </button>
        }
      />
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Instrumento</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Nombre</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{item.nombre}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Fecha de publicación</span>
              <p className="text-sm text-gray-700 mt-0.5">{item.fecha_publicacion ?? '—'}</p>
            </div>
            {item.base_de_datos && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Base de datos</span>
                <button
                  onClick={() => navigate(`/bases-de-datos/${item.base_de_datos!.id}`)}
                  className="block text-sm text-blue-600 hover:text-blue-700 mt-0.5"
                >
                  {item.base_de_datos.nombre}
                </button>
              </div>
            )}
            {item.descripcion && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Descripción</span>
                <p className="text-sm text-gray-700 mt-0.5">{item.descripcion}</p>
              </div>
            )}
            {(item.urls?.length ?? 0) > 0 && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">URLs ({item.urls!.length})</span>
                <div className="flex flex-col gap-0.5 mt-1">
                  {item.urls!.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => navigate(`/urls/${u.id}`)}
                      className="text-xs text-brand-600 hover:underline text-left font-mono truncate"
                    >
                      {u.url.length > 80 ? u.url.slice(0, 80) + '…' : u.url}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Metadatos</h3>
          <MetaSection meta={item.meta ?? {}} onSave={handleMetaSave} canWrite={canWrite} />
        </section>
      </div>
    </>
  )
}
