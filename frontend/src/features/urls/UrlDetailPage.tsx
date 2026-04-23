import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import MetaSection from '@/components/MetaSection'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { UrlDetail } from '@/types'
import { getUrl, updateUrl } from './services/urlsService'

export default function UrlDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<UrlDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getUrl(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateUrl(id!, { meta: newMeta })
    setItem((prev) => prev ? { ...prev, meta: newMeta } : null)
  }

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  return (
    <>
      <Topbar
        title="URL"
        actions={
          <button onClick={() => navigate(-1)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md">
            ← Volver
          </button>
        }
      />
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">URL</h3>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Enlace</span>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-brand-600 hover:text-brand-700 break-all mt-0.5"
              >
                {item.url}
              </a>
            </div>
            {item.instrumento && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Instrumento</span>
                <button
                  onClick={() => navigate(`/instrumentos/${item.instrumento!.id}`)}
                  className="block text-sm text-brand-600 hover:text-brand-700 mt-0.5"
                >
                  {item.instrumento.nombre}
                </button>
              </div>
            )}
            {item.instrumento?.base_de_datos && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Base de datos</span>
                <button
                  onClick={() => navigate(`/bases-de-datos/${item.instrumento!.base_de_datos!.id}`)}
                  className="block text-sm text-blue-600 hover:text-blue-700 mt-0.5"
                >
                  {item.instrumento.base_de_datos.nombre}
                </button>
              </div>
            )}
            {(item.archivos?.length ?? 0) > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Archivos ({item.archivos!.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.archivos!.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/archivos/${a.id}`)}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full hover:bg-gray-200 font-medium"
                    >
                      {a.descripcion ?? a.id.slice(0, 8)}
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
