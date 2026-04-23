import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import MetaSection from '@/components/MetaSection'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { Archivo } from '@/types'
import { getArchivo, updateArchivo } from './services/archivosService'

export default function ArchivoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<Archivo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getArchivo(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateArchivo(id!, { meta: newMeta })
    setItem((prev) => prev ? { ...prev, meta: newMeta } : null)
  }

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  return (
    <>
      <Topbar
        title="Archivo"
        actions={
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md">
            ← Volver
          </button>
        }
      />
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Archivo</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Descripción</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{item.descripcion ?? '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Fecha fuente</span>
              <p className="text-sm text-gray-700 mt-0.5">{item.fecha_fuente ?? '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Fecha de publicación</span>
              <p className="text-sm text-gray-700 mt-0.5">{item.fecha_publicacion ?? '—'}</p>
            </div>
            {item.url_ref && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">URL</span>
                <a
                  href={item.url_ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-brand-600 hover:text-brand-700 break-all mt-0.5"
                >
                  {item.url_ref.url}
                </a>
              </div>
            )}
            {item.url_ref?.instrumento && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Instrumento</span>
                <p
                  className="text-sm text-brand-600 hover:text-brand-700 cursor-pointer mt-0.5"
                  onClick={() => navigate(`/instrumentos/${item.url_ref!.instrumento!.id}`)}
                >
                  {item.url_ref.instrumento.nombre}
                </p>
              </div>
            )}
            {item.url_ref?.instrumento?.base_de_datos && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Base de datos</span>
                <p
                  className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer mt-0.5"
                  onClick={() => navigate(`/bases-de-datos/${item.url_ref!.instrumento!.base_de_datos!.id}`)}
                >
                  {item.url_ref.instrumento.base_de_datos.nombre}
                </p>
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
