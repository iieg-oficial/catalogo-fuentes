import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { Tabla } from '@/types'
import { getTabla, updateTabla } from './services/tablasService'

const TIPOS = ['texto', 'entero', 'decimal', 'booleano', 'fecha', 'fecha_hora', 'json', 'otro']

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9F8FA8' }}>
      {children}
    </p>
  )
}

const ArrowIcon = () => (
  <svg className="ml-auto shrink-0 text-ink/20 group-hover:text-brand-500 transition-colors duration-100" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h8M7 3l4 4-4 4" />
  </svg>
)

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopiedKey(null), 500)
  }

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
      const updated = await updateTabla(id, { campos: [...item.campos, newCampo] })
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
    setSaving(true)
    try {
      const updated = await updateTabla(id, { campos: item.campos.filter((_, i) => i !== index) })
      setItem(updated)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  const metaEntries = Object.entries(item.meta ?? {})

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
      <div className="p-8 md:p-10 max-w-5xl mx-auto space-y-8">
        <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
          <span className="text-ink/35 font-medium">Catálogo</span>
          <span className="text-ink/25">›</span>
          <button onClick={() => navigate(-1)} className="text-ink/50 hover:text-brand-600 transition-colors duration-150 font-medium">
            Tablas
          </button>
          <span className="text-ink/25">›</span>
          <span className="text-ink/70 font-medium">{item.nombre}</span>
        </nav>

        <div className="flex items-start gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9F8FA8' }}>
              Tabla
            </p>
            <h1 className="text-ink leading-tight break-words mb-3" style={{ fontFamily: '"Newsreader", "EB Garamond", Georgia, serif', fontSize: '44px', fontWeight: 500 }}>
              {item.nombre}
            </h1>
          </div>
          <div className="shrink-0 pt-1">
            <button onClick={() => navigate(-1)} className="h-8 px-4 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-150">
              Volver
            </button>
          </div>
        </div>

        <div className="grid gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
          <div className="space-y-10 min-w-0">
            {item.base_de_datos && (
              <section>
                <SectionHeading>Base de datos</SectionHeading>
                <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => navigate(`/bases-de-datos/${item.base_de_datos!.id}`)}
                    className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group"
                  >
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">BD</span>
                    <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.base_de_datos.nombre}</span>
                    <ArrowIcon />
                  </button>
                </div>
              </section>
            )}

            {item.productos.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9F8FA8' }}>Productos vinculados</p>
                  <button onClick={() => copy('productos', item.productos.map((p) => p.nombre).join('\n'))}
                    className="text-[11px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1">
                    {copiedKey === 'productos' ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6" /></svg> : <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M2 10V2h8" /></svg>}
                    {copiedKey === 'productos' ? 'Copiado' : 'Copiar todos'}
                  </button>
                </div>
                <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                  {item.productos.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/productos/${p.id}`)}
                      className="w-full text-left p-3 px-4 flex items-center gap-3 border-b last:border-b-0 border-ink/[5%] hover:bg-brand-500/[2%] transition-colors duration-100 group">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">Producto</span>
                      <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{p.nombre}</span>
                      <ArrowIcon />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9F8FA8' }}>
                  Campos ({item.campos.length})
                </p>
                {canWrite && (
                  <button onClick={() => setShowForm(true)} className="text-[11px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
                    Agregar campo
                  </button>
                )}
              </div>
              {item.campos.length === 0 ? (
                <p className="text-[13px] text-ink/[35%] italic">Sin campos definidos</p>
              ) : (
                <div className="border border-ink/[8%] rounded-lg overflow-hidden bg-white">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink/[8%] bg-ink/[2%]">
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9F8FA8' }}>Nombre</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest w-28" style={{ color: '#9F8FA8' }}>Tipo</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9F8FA8' }}>Descripción</th>
                        {canWrite && <th className="px-4 py-2.5 w-10" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/[5%]">
                      {item.campos.map((campo, i) => (
                        <tr key={i} className="hover:bg-ink/[1%]">
                          <td className="px-4 py-2.5 font-mono text-[12px] text-ink/80">{String(campo.nombre ?? '')}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-block bg-ink/[5%] text-ink/60 text-[11px] px-2 py-0.5 rounded">
                              {String(campo.tipo ?? '')}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] text-ink/50">{String(campo.descripcion ?? '')}</td>
                          {canWrite && (
                            <td className="px-4 py-2.5 text-center">
                              <button onClick={() => handleDeleteCampo(i)} disabled={saving}
                                className="text-ink/20 hover:text-red-400 text-base leading-none disabled:opacity-30 transition-colors duration-150"
                                title="Eliminar campo">×</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-1" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
            <SectionHeading>Metadata</SectionHeading>
            {metaEntries.length === 0 ? (
              <p className="text-[12px] text-ink/[35%] italic">Sin metadatos</p>
            ) : (
              <dl className="divide-y divide-ink/[5%]">
                {metaEntries.map(([key, val]) => (
                  <div key={key} className="py-2">
                    <dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>{key}</dt>
                    <dd className="text-[13px] text-ink/80 break-words">
                      {val == null || val === '' ? <span className="text-ink/30 italic">—</span>
                        : Array.isArray(val) ? val.join(', ')
                        : typeof val === 'boolean' ? (val ? 'Sí' : 'No')
                        : String(val)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {canWrite && (
              <button onClick={() => handleMetaSave({ ...item.meta })} className="mt-3 text-[12px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
                Agregar campo
              </button>
            )}
            {(item.updated_at || item.updated_by_email) && (
              <div className="mt-6 pt-4 border-t border-ink/[6%] space-y-2">
                {item.updated_at && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>Última edición</p>
                    <p className="text-[12px] text-ink/70">{formatDate(item.updated_at)}</p>
                  </div>
                )}
                {item.updated_by_email && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>Último editor</p>
                    <p className="text-[12px] text-ink/70">{item.updated_by_email}</p>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
      </div>

      <Modal open={showForm} title="Agregar campo" onClose={() => setShowForm(false)}>
        <form onSubmit={handleAddCampo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="e.g. id_municipio"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500">
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Qué representa este campo"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50">
              {saving ? 'Guardando…' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
