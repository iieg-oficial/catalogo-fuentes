import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Dataset, Fuente } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getDatasets, createDataset, updateDataset, deleteDataset } from '../services/datasetsService'
import { getFuentes } from '@/features/fuentes/services/fuentesService'
import { nombreIcon, descripcionIcon, temaIcon, frecuenciaIcon, estadoIcon, fuentesIcon, urlIcon, fechaIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function DatasetsPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Dataset[]>([])
  const [fuentes, setFuentes] = useState<Fuente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newNombreCorto, setNewNombreCorto] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIdentificador, setNewIdentificador] = useState('')
  const [newPeriodicidad, setNewPeriodicidad] = useState('')
  const [newVigente, setNewVigente] = useState('')
  const [newUrlPagina, setNewUrlPagina] = useState('')
  const [newUrlMetodologia, setNewUrlMetodologia] = useState('')
  const [newUrlMetadatos, setNewUrlMetadatos] = useState('')
  const [newDesagregacion, setNewDesagregacion] = useState('')
  const [newCobertura, setNewCobertura] = useState('')
  const [newUnidadObs, setNewUnidadObs] = useState('')
  const [newTema, setNewTema] = useState('')
  const [newProposito, setNewProposito] = useState('')
  const [newFechaInicio, setNewFechaInicio] = useState('')
  const [newFechaFin, setNewFechaFin] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')
  const [newEtiquetas, setNewEtiquetas] = useState('')
  const [newUrlNormativa, setNewUrlNormativa] = useState('')
  const [newFuenteId, setNewFuenteId] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [datasets, fuentesList] = await Promise.all([getDatasets(), getFuentes()])
      setItems(datasets)
      setFuentes(fuentesList)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewNombre(''); setNewNombreCorto(''); setNewDesc(''); setNewIdentificador('')
    setNewPeriodicidad(''); setNewVigente(''); setNewUrlPagina(''); setNewUrlMetodologia('')
    setNewUrlMetadatos(''); setNewDesagregacion(''); setNewCobertura(''); setNewUnidadObs('')
    setNewTema(''); setNewProposito(''); setNewFechaInicio(''); setNewFechaFin('')
    setNewObservaciones(''); setNewEtiquetas(''); setNewUrlNormativa(''); setNewFuenteId('')
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createDataset({
        nombre: newNombre,
        nombre_corto: newNombreCorto || undefined,
        descripcion: newDesc || undefined,
        identificador_persistente: newIdentificador || undefined,
        periodicidad: newPeriodicidad || undefined,
        vigente: newVigente ? newVigente === 'true' : undefined,
        url_pagina_principal: newUrlPagina || undefined,
        url_metodologia_general: newUrlMetodologia || undefined,
        url_metadatos_general: newUrlMetadatos || undefined,
        desagregacion_geografica: newDesagregacion || undefined,
        cobertura_temporal_general: newCobertura || undefined,
        unidad_observacion: newUnidadObs || undefined,
        tema_principal: newTema || undefined,
        proposito: newProposito || undefined,
        fecha_inicio_disponibilidad: newFechaInicio || undefined,
        fecha_fin_disponibilidad: newFechaFin || undefined,
        observaciones_dataset: newObservaciones || undefined,
        etiquetas: newEtiquetas ? newEtiquetas.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        url_normativa_o_marco_legal: newUrlNormativa || undefined,
        fuente_id: newFuenteId || undefined,
      })
      setAddingRow(false); resetFields(); await load(true)
    } finally {}
  }

  const handleEditCell = (row: Dataset, field: string, value: string | boolean) => {
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
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) } catch { return d }
  }


  const columns: Column<Dataset>[] = [
    { header: 'Nombre', icon: nombreIcon(), render: (r) => <TextCell value={r.nombre} />, className: 'w-48', getValue: (r) => r.nombre, onEdit: (r, v) => handleEditCell(r, 'nombre', v) },
    { header: 'Nombre corto', icon: nombreIcon(), render: (r) => <TextCell value={r.nombre_corto} />, getValue: (r) => r.nombre_corto ?? '', onEdit: (r, v) => handleEditCell(r, 'nombre_corto', v) },
    { header: 'Descripcion', icon: descripcionIcon(), render: (r) => <TextCell value={r.descripcion} />, getValue: (r) => r.descripcion ?? '', onEdit: (r, v) => handleEditCell(r, 'descripcion', v) },
    { header: 'ID persistente', icon: descripcionIcon(), render: (r) => <TextCell value={r.identificador_persistente} />, getValue: (r) => r.identificador_persistente ?? '', onEdit: (r, v) => handleEditCell(r, 'identificador_persistente', v) },
    { header: 'Periodicidad', icon: frecuenciaIcon(), render: (r) => <TextCell value={r.periodicidad} />, getValue: (r) => r.periodicidad ?? '', onEdit: (r, v) => handleEditCell(r, 'periodicidad', v) },
    { header: 'Vigente', icon: estadoIcon(), render: (r) => r.vigente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span>, selectOptions: [{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }], onEdit: (r, v) => handleEditCell(r, 'vigente', v === 'true'), getValue: (r) => r.vigente ? 'true' : 'false' },
    { header: 'URL principal', icon: urlIcon(), render: (r) => <TextCell value={r.url_pagina_principal} mono link />, getValue: (r) => r.url_pagina_principal ?? '', onEdit: (r, v) => handleEditCell(r, 'url_pagina_principal', v) },
    { header: 'URL metodologia', icon: urlIcon(), render: (r) => <TextCell value={r.url_metodologia_general} mono link />, getValue: (r) => r.url_metodologia_general ?? '', onEdit: (r, v) => handleEditCell(r, 'url_metodologia_general', v) },
    { header: 'URL metadatos', icon: urlIcon(), render: (r) => <TextCell value={r.url_metadatos_general} mono link />, getValue: (r) => r.url_metadatos_general ?? '', onEdit: (r, v) => handleEditCell(r, 'url_metadatos_general', v) },
    { header: 'Desagregacion geo', icon: descripcionIcon(), render: (r) => <TextCell value={r.desagregacion_geografica} />, getValue: (r) => r.desagregacion_geografica ?? '', onEdit: (r, v) => handleEditCell(r, 'desagregacion_geografica', v) },
    { header: 'Cobertura temporal', icon: descripcionIcon(), render: (r) => <TextCell value={r.cobertura_temporal_general} />, getValue: (r) => r.cobertura_temporal_general ?? '', onEdit: (r, v) => handleEditCell(r, 'cobertura_temporal_general', v) },
    { header: 'Unidad observacion', icon: descripcionIcon(), render: (r) => <TextCell value={r.unidad_observacion} />, getValue: (r) => r.unidad_observacion ?? '', onEdit: (r, v) => handleEditCell(r, 'unidad_observacion', v) },
    { header: 'Tema', icon: temaIcon(), render: (r) => r.tema_principal ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-violet-500/10 text-violet-700">{r.tema_principal}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.tema_principal ?? '', onEdit: (r, v) => handleEditCell(r, 'tema_principal', v) },
    { header: 'Proposito', icon: descripcionIcon(), render: (r) => <TextCell value={r.proposito} />, getValue: (r) => r.proposito ?? '', onEdit: (r, v) => handleEditCell(r, 'proposito', v) },
    { header: 'Inicio disponibilidad', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_inicio_disponibilidad) ?? '--'}</span>, getValue: (r) => r.fecha_inicio_disponibilidad ?? '', onEdit: (r, v) => handleEditCell(r, 'fecha_inicio_disponibilidad', v), inputType: 'date' },
    { header: 'Fin disponibilidad', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_fin_disponibilidad) ?? '--'}</span>, getValue: (r) => r.fecha_fin_disponibilidad ?? '', onEdit: (r, v) => handleEditCell(r, 'fecha_fin_disponibilidad', v), inputType: 'date' },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => <TextCell value={r.observaciones_dataset} />, getValue: (r) => r.observaciones_dataset ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_dataset', v) },
    { header: 'Etiquetas', icon: jsonIcon(), render: (r) => { const t = r.etiquetas ?? []; return t.length ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">{t.length} tags</span> : <span className="text-ink/30 text-[13px]">--</span> }, getValue: (r) => (r.etiquetas ?? []).join(', '), onEdit: (r, v) => { const tags = v ? String(v).split(',').map((t) => t.trim()).filter(Boolean) : []; updateDataset(r.id, { etiquetas: tags }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, etiquetas: tags } : i))) } },
    { header: 'URL normativa', icon: urlIcon(), render: (r) => <TextCell value={r.url_normativa_o_marco_legal} mono link />, getValue: (r) => r.url_normativa_o_marco_legal ?? '', onEdit: (r, v) => handleEditCell(r, 'url_normativa_o_marco_legal', v) },
    { header: 'Fuente', icon: fuentesIcon(), render: (r) => r.fuente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.fuente.nombre}</span> : <span className="text-ink/30 text-[13px]">--</span>, selectOptions: fuentes.map((f) => ({ value: f.id, label: f.nombre })), onEdit: (r, v) => { updateDataset(r.id, { fuente_id: v }); const f = fuentes.find((x) => x.id === v) ?? null; setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, fuente_id: v || null, fuente: f } : i))) }, getValue: (r) => r.fuente_id ?? '' },
  ]

  const addRowCells = (
    <>
      {/* 1. Nombre */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      {/* 2. Nombre corto */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newNombreCorto} onChange={(e) => setNewNombreCorto(e.target.value)} onKeyDown={kd} placeholder="Nombre corto..." className={inputCls} />
      </td>
      {/* 3. Descripcion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      {/* 4. ID persistente */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newIdentificador} onChange={(e) => setNewIdentificador(e.target.value)} onKeyDown={kd} placeholder="ID persistente..." className={inputCls} />
      </td>
      {/* 5. Periodicidad */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newPeriodicidad} onChange={(e) => setNewPeriodicidad(e.target.value)} onKeyDown={kd} placeholder="Periodicidad..." className={inputCls} />
      </td>
      {/* 6. Vigente */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newVigente} onChange={setNewVigente} options={[{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]} placeholder="Vigente..." label="Vigente" />
      </td>
      {/* 7. URL principal */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlPagina} onChange={(e) => setNewUrlPagina(e.target.value)} onKeyDown={kd} placeholder="URL pagina..." className={inputCls} />
      </td>
      {/* 8. URL metodologia */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlMetodologia} onChange={(e) => setNewUrlMetodologia(e.target.value)} onKeyDown={kd} placeholder="URL metodologia..." className={inputCls} />
      </td>
      {/* 9. URL metadatos */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlMetadatos} onChange={(e) => setNewUrlMetadatos(e.target.value)} onKeyDown={kd} placeholder="URL metadatos..." className={inputCls} />
      </td>
      {/* 10. Desagregacion geo */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesagregacion} onChange={(e) => setNewDesagregacion(e.target.value)} onKeyDown={kd} placeholder="Desagregacion..." className={inputCls} />
      </td>
      {/* 11. Cobertura temporal */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newCobertura} onChange={(e) => setNewCobertura(e.target.value)} onKeyDown={kd} placeholder="Cobertura..." className={inputCls} />
      </td>
      {/* 12. Unidad observacion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUnidadObs} onChange={(e) => setNewUnidadObs(e.target.value)} onKeyDown={kd} placeholder="Unidad obs..." className={inputCls} />
      </td>
      {/* 13. Tema */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newTema} onChange={(e) => setNewTema(e.target.value)} onKeyDown={kd} placeholder="Tema..." className={inputCls} />
      </td>
      {/* 14. Proposito */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newProposito} onChange={(e) => setNewProposito(e.target.value)} onKeyDown={kd} placeholder="Proposito..." className={inputCls} />
      </td>
      {/* 15. Inicio disponibilidad */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="date" value={newFechaInicio} onChange={(e) => setNewFechaInicio(e.target.value)} className={inputCls} />
      </td>
      {/* 16. Fin disponibilidad */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="date" value={newFechaFin} onChange={(e) => setNewFechaFin(e.target.value)} className={inputCls} />
      </td>
      {/* 17. Observaciones */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
      {/* 18. Etiquetas */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newEtiquetas} onChange={(e) => setNewEtiquetas(e.target.value)} onKeyDown={kd} placeholder="tag1, tag2..." className={inputCls} />
      </td>
      {/* 19. URL normativa */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlNormativa} onChange={(e) => setNewUrlNormativa(e.target.value)} onKeyDown={kd} placeholder="URL normativa..." className={inputCls} />
      </td>
      {/* 20. Fuente */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newFuenteId} onChange={setNewFuenteId} options={fuentes.map((f) => ({ value: f.id, label: f.nombre }))} placeholder="Fuente..." label="Fuente" />
      </td>
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
