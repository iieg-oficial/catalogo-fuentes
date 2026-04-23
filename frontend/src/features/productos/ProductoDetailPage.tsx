import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import MetaSection from '@/components/MetaSection'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { ProductoDetail } from '@/types'
import { getProducto, updateProducto } from './services/productosService'

export default function ProductoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<ProductoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getProducto(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateProducto(id!, { meta: newMeta })
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
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Producto</h3>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Nombre</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{item.nombre}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Proyecto</span>
              <button
                onClick={() => navigate(`/proyectos/${item.proyecto.id}`)}
                className="block text-sm text-brand-600 hover:text-brand-700 mt-0.5"
              >
                {item.proyecto.nombre}
              </button>
            </div>
            {item.descripcion && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Descripción</span>
                <p className="text-sm text-gray-700 mt-0.5">{item.descripcion}</p>
              </div>
            )}
            {item.tablas.length > 0 && (
              <div>
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
