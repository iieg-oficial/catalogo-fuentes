import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import Modal from '@/components/Modal'
import MetaSection from '@/components/MetaSection'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { Tabla } from '@/types'
import { getTabla, updateTabla } from './services/tablasService'

const TIPOS = ['texto', 'entero', 'decimal', 'booleano', 'fecha', 'fecha_hora', 'json', 'otro']

export default function TablaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<Tabla | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('texto')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getTabla(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleAddCampo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !id) return
    setSaving(true)
    try {
      const newCampo: Record<string, unknown> = { nombre, tipo }
      if (descripcion) newCampo.descripcion = descripcion
      const updatedCampos = [...item.campos, newCampo]
      const updated = await updateTabla(id, { campos: updatedCampos })
      setItem(updated)
      setShowForm(false)
      setNombre('')
      setTipo('texto')
      setDescripcion('')
    } finally {
      setSaving(false)
    }
  }

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    const updated = await updateTabla(id!, { meta: newMeta })
    setItem(updated)
  }

  const handleDeleteCampo = async (index: number) => {
    if (!item || !id) return
    const updatedCampos = item.campos.filter((_, i) => i !== index)
    setSaving(true)
    try {
      const updated = await updateTabla(id, { campos: updatedCampos })
      setItem(updated)
    } finally {
      setSaving(false)
    }
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
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tabla</h3>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Nombre</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{item.nombre}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wide">Base de datos</span>
              <button
                onClick={() => navigate(`/bases-de-datos/${item.base_de_datos.id}`)}
                className="block text-sm text-blue-600 hover:text-blue-700 mt-0.5"
              >
                {item.base_de_datos.nombre}
              </button>
            </div>
            {item.productos.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">Productos ({item.productos.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.productos.map((p) => (
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
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Campos ({item.campos.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-gray-100 text-left text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 font-semibold">Nombre</th>
                  <th className="px-4 py-2 font-semibold w-28">Tipo</th>
                  <th className="px-4 py-2 font-semibold">Descripción</th>
                  {canWrite && <th className="px-4 py-2 w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {item.campos.length === 0 && !canWrite && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-sm text-gray-400 text-center">
                      Sin campos definidos.
                    </td>
                  </tr>
                )}
                {item.campos.map((campo, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-900">{String(campo.nombre ?? '')}</td>
                    <td className="px-4 py-2">
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {String(campo.tipo ?? '')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{String(campo.descripcion ?? '')}</td>
                    {canWrite && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDeleteCampo(i)}
                          disabled={saving}
                          className="text-gray-300 hover:text-red-500 text-base leading-none disabled:opacity-30"
                          title="Eliminar campo"
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {canWrite && (
                  <tr className="bg-white border-t border-gray-200 hover:bg-gray-50">
                    <td colSpan={canWrite ? 4 : 3} className="px-4 py-2">
                      <button
                        onClick={() => setShowForm(true)}
                        className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                      >
                        + Agregar campo
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Metadatos</h3>
          <MetaSection meta={item.meta} onSave={handleMetaSave} canWrite={canWrite} />
        </section>
      </div>

      <Modal open={showForm} title="Agregar campo" onClose={() => setShowForm(false)}>
        <form onSubmit={handleAddCampo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="e.g. id_municipio"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Qué representa este campo"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50">
              {saving ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
