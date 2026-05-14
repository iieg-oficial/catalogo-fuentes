import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { EdicionDataset } from '@/types'
import { getEdicionesDataset, createEdicionDataset, deleteEdicionDataset } from '../services/edicionesDatasetService'
import { nombreIcon, descripcionIcon, fechaIcon, datasetsIcon, estadoIcon, urlIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function EdicionesDatasetPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<EdicionDataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try { setItems(await getEdicionesDataset()) } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre('') }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try { await createEdicionDataset({ nombre: newNombre }); setAddingRow(false); resetFields(); await load(true) } finally {}
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteEdicionDataset(id))); await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.dataset?.nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
  }

  const txt = (v: string | null | undefined) => <span className="text-ink/70 text-[13px]">{v ?? '--'}</span>
  const link = (v: string | null | undefined) => v ? <a href={v} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-mono text-[12px] text-brand-600 hover:underline truncate block" style={{ maxWidth: 180 }}>{v}</a> : <span className="text-ink/30 text-[13px]">--</span>

  const columns: Column<EdicionDataset>[] = [
    { header: 'Nombre', icon: nombreIcon(), render: (r) => <span className="font-medium text-ink">{r.nombre}</span>, className: 'w-48', getValue: (r) => r.nombre },
    { header: 'Dataset', icon: datasetsIcon(), render: (r) => r.dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.dataset.nombre}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.dataset?.nombre ?? '' },
    { header: 'Publicacion', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_publicacion) ?? '--'}</span>, getValue: (r) => r.fecha_publicacion ?? '' },
    { header: 'Periodo inicio', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.periodo_referencia_inicio) ?? '--'}</span>, getValue: (r) => r.periodo_referencia_inicio ?? '' },
    { header: 'Periodo fin', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.periodo_referencia_fin) ?? '--'}</span>, getValue: (r) => r.periodo_referencia_fin ?? '' },
    { header: 'Tipo periodo', icon: descripcionIcon(), render: (r) => txt(r.tipo_periodo_referencia), getValue: (r) => r.tipo_periodo_referencia ?? '' },
    { header: 'Levantamiento inicio', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_levantamiento_inicio) ?? '--'}</span>, getValue: (r) => r.fecha_levantamiento_inicio ?? '' },
    { header: 'Levantamiento fin', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_levantamiento_fin) ?? '--'}</span>, getValue: (r) => r.fecha_levantamiento_fin ?? '' },
    { header: 'URL documentacion', icon: urlIcon(), render: (r) => link(r.url_documentacion_edicion), getValue: (r) => r.url_documentacion_edicion ?? '' },
    { header: 'URL comunicado', icon: urlIcon(), render: (r) => link(r.url_comunicado_publicacion), getValue: (r) => r.url_comunicado_publicacion ?? '' },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => txt(r.observaciones_edicion), getValue: (r) => r.observaciones_edicion ?? '' },
    { header: 'Version', icon: descripcionIcon(), render: (r) => txt(r.version_publicacion), getValue: (r) => r.version_publicacion ?? '' },
    { header: 'Corregida', icon: estadoIcon(), render: (r) => r.es_version_corregida ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">Si</span> : <span className="text-ink/30 text-[13px]">No</span>, getValue: (r) => r.es_version_corregida ? 'Si' : 'No' },
  ]

  const emptyTd = <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      {emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">x</button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Ediciones de dataset" addLabel="Nueva edicion" entityLabel="ediciones" rows={filtered} columns={columns} getKey={(r) => r.id} onRowClick={(r) => navigate(`/ediciones-dataset/${r.id}`)} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} />
    </div>
  )
}
