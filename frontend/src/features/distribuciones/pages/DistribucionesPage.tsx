import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Distribucion } from '@/types'
import { getDistribuciones, createDistribucion, updateDistribucion, deleteDistribucion } from '../services/distribucionesService'
import { nombreIcon, descripcionIcon, estadoIcon, edicionesIcon, urlIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function DistribucionesPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Distribucion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newDescriptor, setNewDescriptor] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try { setItems(await getDistribuciones()) } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewDescriptor(''); setNewUrl(''); setNewObservaciones('') }

  const handleSaveRow = async () => {
    if (!newDescriptor.trim()) return
    try { await createDistribucion({ descriptor: newDescriptor, url: newUrl || undefined, observaciones_distribucion: newObservaciones || undefined }); setAddingRow(false); resetFields(); await load(true) } finally {}
  }

  const handleEditCell = (row: Distribucion, field: string, value: string) => {
    updateDistribucion(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteDistribucion(id))); await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.descriptor, i.url, i.edicion_dataset?.nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Distribucion>[] = [
    { header: 'Descripcion', icon: nombreIcon(), render: (r) => <span className="font-medium text-ink">{r.descriptor ?? r.id.slice(0, 8)}</span>, className: 'w-48', getValue: (r) => r.descriptor ?? '', onEdit: (r, v) => handleEditCell(r, 'descriptor', v) },
    { header: 'URL', icon: urlIcon(), render: (r) => r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-mono text-[12px] text-brand-600 hover:underline truncate block" style={{ maxWidth: 200 }}>{r.url}</a> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.url ?? '', onEdit: (r, v) => handleEditCell(r, 'url', v) },
    { header: 'Edicion', icon: edicionesIcon(), render: (r) => r.edicion_dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.edicion_dataset.nombre}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.edicion_dataset?.nombre ?? '' },
    { header: 'Req. autenticacion', icon: estadoIcon(), render: (r) => r.requiere_autenticacion ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">Si</span> : <span className="text-ink/30 text-[13px]">No</span>, getValue: (r) => r.requiere_autenticacion ? 'Si' : 'No' },
    { header: 'Req. registro', icon: estadoIcon(), render: (r) => r.requiere_registro ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">Si</span> : <span className="text-ink/30 text-[13px]">No</span>, getValue: (r) => r.requiere_registro ? 'Si' : 'No' },
    { header: 'URL persistente', icon: estadoIcon(), render: (r) => r.es_url_persistente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="text-ink/30 text-[13px]">No</span>, getValue: (r) => r.es_url_persistente ? 'Si' : 'No' },
    { header: 'Estado URL', icon: descripcionIcon(), render: (r) => <span className="text-ink/70 text-[13px]">{r.estado_url_ultima_revision ?? '--'}</span>, getValue: (r) => r.estado_url_ultima_revision ?? '', onEdit: (r, v) => handleEditCell(r, 'estado_url_ultima_revision', v) },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => <span className="text-ink/70 text-[13px]">{r.observaciones_distribucion ?? '--'}</span>, getValue: (r) => r.observaciones_distribucion ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_distribucion', v) },
  ]

  const emptyTd = <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newDescriptor} onChange={(e) => setNewDescriptor(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={kd} placeholder="URL..." className={inputCls} />
      </td>
      {emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">x</button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Distribuciones" addLabel="Nueva distribucion" entityLabel="distribuciones" rows={filtered} columns={columns} getKey={(r) => r.id} onRowClick={(r) => navigate(`/distribuciones/${r.id}`)} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} />
    </div>
  )
}
