import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Dataset } from '@/types'
import { getDatasets, createDataset, updateDataset, deleteDataset } from '../services/datasetsService'
import { nombreIcon, descripcionIcon, temaIcon, frecuenciaIcon, estadoIcon, fuentesIcon, urlIcon, fechaIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function DatasetsPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newNombreCorto, setNewNombreCorto] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPeriodicidad, setNewPeriodicidad] = useState('')
  const [newTema, setNewTema] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try { setItems(await getDatasets()) } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewNombreCorto(''); setNewDesc(''); setNewPeriodicidad(''); setNewTema('') }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createDataset({ nombre: newNombre, nombre_corto: newNombreCorto || undefined, descripcion: newDesc || undefined, periodicidad: newPeriodicidad || undefined, tema_principal: newTema || undefined })
      setAddingRow(false); resetFields(); await load(true)
    } finally {}
  }

  const handleEditCell = (row: Dataset, field: string, value: string) => {
    updateDataset(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteDataset(id))); await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.descripcion, i.tema_principal, i.fuente?.nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
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

  const columns: Column<Dataset>[] = [
    { header: 'Nombre', icon: nombreIcon(), render: (r) => <span className="font-medium text-ink">{r.nombre}</span>, className: 'w-48', getValue: (r) => r.nombre, onEdit: (r, v) => handleEditCell(r, 'nombre', v) },
    { header: 'Nombre corto', icon: nombreIcon(), render: (r) => txt(r.nombre_corto), getValue: (r) => r.nombre_corto ?? '', onEdit: (r, v) => handleEditCell(r, 'nombre_corto', v) },
    { header: 'Descripcion', icon: descripcionIcon(), render: (r) => txt(r.descripcion), getValue: (r) => r.descripcion ?? '', onEdit: (r, v) => handleEditCell(r, 'descripcion', v) },
    { header: 'ID persistente', icon: descripcionIcon(), render: (r) => txt(r.identificador_persistente), getValue: (r) => r.identificador_persistente ?? '', onEdit: (r, v) => handleEditCell(r, 'identificador_persistente', v) },
    { header: 'Periodicidad', icon: frecuenciaIcon(), render: (r) => txt(r.periodicidad), getValue: (r) => r.periodicidad ?? '', onEdit: (r, v) => handleEditCell(r, 'periodicidad', v) },
    { header: 'Vigente', icon: estadoIcon(), render: (r) => r.vigente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span>, getValue: (r) => r.vigente ? 'Si' : 'No' },
    { header: 'URL principal', icon: urlIcon(), render: (r) => link(r.url_pagina_principal), getValue: (r) => r.url_pagina_principal ?? '', onEdit: (r, v) => handleEditCell(r, 'url_pagina_principal', v) },
    { header: 'URL metodologia', icon: urlIcon(), render: (r) => link(r.url_metodologia_general), getValue: (r) => r.url_metodologia_general ?? '', onEdit: (r, v) => handleEditCell(r, 'url_metodologia_general', v) },
    { header: 'URL metadatos', icon: urlIcon(), render: (r) => link(r.url_metadatos_general), getValue: (r) => r.url_metadatos_general ?? '', onEdit: (r, v) => handleEditCell(r, 'url_metadatos_general', v) },
    { header: 'Desagregacion geo', icon: descripcionIcon(), render: (r) => txt(r.desagregacion_geografica), getValue: (r) => r.desagregacion_geografica ?? '', onEdit: (r, v) => handleEditCell(r, 'desagregacion_geografica', v) },
    { header: 'Cobertura temporal', icon: descripcionIcon(), render: (r) => txt(r.cobertura_temporal_general), getValue: (r) => r.cobertura_temporal_general ?? '', onEdit: (r, v) => handleEditCell(r, 'cobertura_temporal_general', v) },
    { header: 'Unidad observacion', icon: descripcionIcon(), render: (r) => txt(r.unidad_observacion), getValue: (r) => r.unidad_observacion ?? '', onEdit: (r, v) => handleEditCell(r, 'unidad_observacion', v) },
    { header: 'Tema', icon: temaIcon(), render: (r) => r.tema_principal ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-violet-500/10 text-violet-700">{r.tema_principal}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.tema_principal ?? '', onEdit: (r, v) => handleEditCell(r, 'tema_principal', v) },
    { header: 'Proposito', icon: descripcionIcon(), render: (r) => txt(r.proposito), getValue: (r) => r.proposito ?? '', onEdit: (r, v) => handleEditCell(r, 'proposito', v) },
    { header: 'Inicio disponibilidad', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_inicio_disponibilidad) ?? '--'}</span>, getValue: (r) => r.fecha_inicio_disponibilidad ?? '' },
    { header: 'Fin disponibilidad', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_fin_disponibilidad) ?? '--'}</span>, getValue: (r) => r.fecha_fin_disponibilidad ?? '' },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => txt(r.observaciones_dataset), getValue: (r) => r.observaciones_dataset ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_dataset', v) },
    { header: 'Etiquetas', icon: jsonIcon(), render: (r) => { const t = r.etiquetas ?? []; return t.length ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">{t.length} tags</span> : <span className="text-ink/30 text-[13px]">--</span> }, getValue: (r) => JSON.stringify(r.etiquetas ?? []) },
    { header: 'URL normativa', icon: urlIcon(), render: (r) => link(r.url_normativa_o_marco_legal), getValue: (r) => r.url_normativa_o_marco_legal ?? '', onEdit: (r, v) => handleEditCell(r, 'url_normativa_o_marco_legal', v) },
    { header: 'Fuente', icon: fuentesIcon(), render: (r) => r.fuente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.fuente.nombre}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.fuente?.nombre ?? '' },
  ]

  const emptyTd = <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newNombreCorto} onChange={(e) => setNewNombreCorto(e.target.value)} onKeyDown={kd} placeholder="Nombre corto..." className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      {emptyTd}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newPeriodicidad} onChange={(e) => setNewPeriodicidad(e.target.value)} onKeyDown={kd} placeholder="Periodicidad..." className={inputCls} />
      </td>
      {emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newTema} onChange={(e) => setNewTema(e.target.value)} onKeyDown={kd} placeholder="Tema..." className={inputCls} />
      </td>
      {emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">x</button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Datasets" addLabel="Nuevo dataset" entityLabel="datasets" rows={filtered} columns={columns} getKey={(r) => r.id} onRowClick={(r) => navigate(`/datasets/${r.id}`)} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} />
    </div>
  )
}
