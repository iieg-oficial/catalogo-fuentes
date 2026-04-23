import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import MetaSection from '@/components/MetaSection'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { BaseDeDatosDetail, Producto, Proyecto } from '@/types'
import { getBaseDeDatos, updateBaseDeDatos } from './services/basesDeDatosService'

export default function BaseDeDatosDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<BaseDeDatosDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateBaseDeDatos(id!, { meta: newMeta })
    setItem((prev) => prev ? { ...prev, meta: newMeta } : null)
  }

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getBaseDeDatos(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const productos = useMemo<Producto[]>(() => {
    if (!item) return []
    const seen = new Set<string>()
    return item.tablas.flatMap((t) => t.productos).filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }, [item])

  const proyectos = useMemo<Proyecto[]>(() => {
    const seen = new Set<string>()
    return productos.map((p) => p.proyecto).filter((pr) => {
      if (seen.has(pr.id)) return false
      seen.add(pr.id)
      return true
    })
  }, [productos])

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
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Base de datos</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Nombre</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{item.nombre}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Tema</span>
              <p className="text-sm text-gray-700 mt-0.5">{item.tema ?? '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Frecuencia</span>
              <p className="text-sm text-gray-700 mt-0.5">{item.frecuencia_actualizacion ?? '—'}</p>
            </div>
            {item.descripcion && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Descripción</span>
                <p className="text-sm text-gray-700 mt-0.5">{item.descripcion}</p>
              </div>
            )}
            {item.tablas.length > 0 && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Tablas ({item.tablas.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tablas.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/tablas/${t.id}`)}
                      className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full hover:bg-blue-100 font-medium"
                    >
                      {t.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {productos.length > 0 && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Productos ({productos.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {productos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/productos/${p.id}`)}
                      className="inline-block bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full hover:bg-brand-200 font-medium"
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {proyectos.length > 0 && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Proyectos ({proyectos.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {proyectos.map((pr) => (
                    <button
                      key={pr.id}
                      onClick={() => navigate(`/proyectos/${pr.id}`)}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full hover:bg-gray-200 font-medium"
                    >
                      {pr.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {item.instrumentos.length > 0 && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Instrumentos ({item.instrumentos.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.instrumentos.map((ins) => (
                    <button
                      key={ins.id}
                      onClick={() => navigate(`/instrumentos/${ins.id}`)}
                      className="inline-block bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full hover:bg-brand-200 font-medium"
                    >
                      {ins.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Metadatos</h3>
          <MetaSection meta={item.meta} onSave={handleMetaSave} canWrite={canWrite} />
        </section>
      </div>
    </>
  )
}
