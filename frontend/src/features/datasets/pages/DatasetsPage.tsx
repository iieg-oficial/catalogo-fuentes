import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Dataset, Fuente, TipoDataset } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getDatasets, getTiposDataset, createDataset, updateDataset, deleteDataset } from '../services/datasetsService'
import { getFuentes } from '@/features/fuentes/services/fuentesService'
import JsonEditorInput from '@/components/JsonEditorInput'
import { JsonCell } from '@/components/JsonCell'
import { nombreIcon, descripcionIcon, temaIcon, frecuenciaIcon, estadoIcon, fuentesIcon, urlIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function DatasetsPage() {
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Dataset[]>([])
  const [fuentes, setFuentes] = useState<Fuente[]>([])
  const [tiposDataset, setTiposDataset] = useState<TipoDataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newNombreCorto, setNewNombreCorto] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newUrlPersistente, setNewUrlPersistente] = useState('')
  const [newPeriodicidad, setNewPeriodicidad] = useState('')
  const [newVigente, setNewVigente] = useState('')
  const [newDesagregacion, setNewDesagregacion] = useState('')
  const [newInicioCobertura, setNewInicioCobertura] = useState('')
  const [newProposito, setNewProposito] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')
  const [newEtiquetas, setNewEtiquetas] = useState<Record<string, unknown>>({})
  const [newUrlNormativa, setNewUrlNormativa] = useState('')
  const [newNomenclatura, setNewNomenclatura] = useState('')
  const [newUrlTerminos, setNewUrlTerminos] = useState('')
  const [newUrlAviso, setNewUrlAviso] = useState('')
  const [newFuenteId, setNewFuenteId] = useState('')
  const [newTipoDatasetId, setNewTipoDatasetId] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [datasets, fuentesList, tipos] = await Promise.all([getDatasets(), getFuentes(), getTiposDataset()])
      setItems(datasets)
      setFuentes(fuentesList)
      setTiposDataset(tipos)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewNombre(''); setNewNombreCorto(''); setNewDesc(''); setNewUrlPersistente('')
    setNewPeriodicidad(''); setNewVigente(''); setNewDesagregacion(''); setNewInicioCobertura('')
    setNewProposito(''); setNewObservaciones(''); setNewEtiquetas({}); setNewUrlNormativa('')
    setNewNomenclatura(''); setNewUrlTerminos(''); setNewUrlAviso(''); setNewFuenteId(''); setNewTipoDatasetId('')
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createDataset({
        nombre: newNombre,
        nombre_corto: newNombreCorto || undefined,
        descripcion: newDesc || undefined,
        url_persistente: newUrlPersistente || undefined,
        periodicidad: newPeriodicidad || undefined,
        vigente: newVigente ? newVigente === 'true' : undefined,
        desagregacion_geografica: newDesagregacion || undefined,
        inicio_cobertura_temporal: newInicioCobertura || undefined,
        proposito: newProposito || undefined,
        observaciones_dataset: newObservaciones || undefined,
        etiquetas: Object.keys(newEtiquetas).length ? newEtiquetas : undefined,
        url_normativa_o_marco_legal: newUrlNormativa || undefined,
        nomenclatura_edicion: newNomenclatura || undefined,
        url_terminos_uso: newUrlTerminos || undefined,
        url_aviso_privacidad: newUrlAviso || undefined,
        fuente_id: newFuenteId || undefined,
        tipo_dataset_id: newTipoDatasetId || undefined,
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
    return !q || [i.nombre, i.descripcion, i.fuente?.nombre, i.tipo_dataset?.nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Dataset>[] = [
    { header: 'Nombre', icon: nombreIcon(), render: (r) => <TextCell value={r.nombre} />, className: 'w-48', getValue: (r) => r.nombre, onEdit: (r, v) => handleEditCell(r, 'nombre', v) },
    { header: 'Nombre corto', icon: nombreIcon(), render: (r) => <TextCell value={r.nombre_corto} />, getValue: (r) => r.nombre_corto ?? '', onEdit: (r, v) => handleEditCell(r, 'nombre_corto', v) },
    { header: 'Descripción', icon: descripcionIcon(), render: (r) => <TextCell value={r.descripcion} />, getValue: (r) => r.descripcion ?? '', onEdit: (r, v) => handleEditCell(r, 'descripcion', v) },
    { header: 'Tipo de dataset', icon: temaIcon(), render: (r) => r.tipo_dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.tipo_dataset.nombre}</span> : <span className="text-ink/60 text-[13px]">--</span>, selectOptions: tiposDataset.map((t) => ({ value: t.id, label: t.nombre })), onEdit: (r, v) => { updateDataset(r.id, { tipo_dataset_id: v }); const t = tiposDataset.find((x) => x.id === v); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, tipo_dataset_id: v || null, tipo_dataset: t ? { id: t.id, nombre: t.nombre } : null } : i))) }, getValue: (r) => r.tipo_dataset_id ?? '' },
    { header: 'URL persistente', icon: urlIcon(), render: (r) => <TextCell value={r.url_persistente} mono link />, getValue: (r) => r.url_persistente ?? '', onEdit: (r, v) => handleEditCell(r, 'url_persistente', v) },
    { header: 'Periodicidad', icon: frecuenciaIcon(), render: (r) => <TextCell value={r.periodicidad} />, getValue: (r) => r.periodicidad ?? '', onEdit: (r, v) => handleEditCell(r, 'periodicidad', v) },
    { header: 'Vigente', icon: estadoIcon(), render: (r) => r.vigente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span>, selectOptions: [{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }], onEdit: (r, v) => handleEditCell(r, 'vigente', v === 'true'), getValue: (r) => r.vigente ? 'true' : 'false' },
    { header: 'Desagregacion geo', icon: descripcionIcon(), render: (r) => <TextCell value={r.desagregacion_geografica} />, getValue: (r) => r.desagregacion_geografica ?? '', onEdit: (r, v) => handleEditCell(r, 'desagregacion_geografica', v) },
    { header: 'Inicio cobertura temporal', icon: descripcionIcon(), render: (r) => <TextCell value={r.inicio_cobertura_temporal} />, getValue: (r) => r.inicio_cobertura_temporal ?? '', onEdit: (r, v) => handleEditCell(r, 'inicio_cobertura_temporal', v) },
    { header: 'Proposito', icon: descripcionIcon(), render: (r) => <TextCell value={r.proposito} />, getValue: (r) => r.proposito ?? '', onEdit: (r, v) => handleEditCell(r, 'proposito', v) },
    { header: 'Nomenclatura edicion', icon: descripcionIcon(), render: (r) => <TextCell value={r.nomenclatura_edicion} />, getValue: (r) => r.nomenclatura_edicion ?? '', onEdit: (r, v) => handleEditCell(r, 'nomenclatura_edicion', v) },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => <TextCell value={r.observaciones_dataset} />, getValue: (r) => r.observaciones_dataset ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_dataset', v) },
    { header: 'Etiquetas', icon: jsonIcon(), render: (r) => <JsonCell value={r.etiquetas} />, getValue: (r) => JSON.stringify(r.etiquetas ?? {}), onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateDataset(r.id, { etiquetas: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, etiquetas: parsed } : i))) } catch {} }, inputType: 'json' },
    { header: 'URL normativa', icon: urlIcon(), render: (r) => <TextCell value={r.url_normativa_o_marco_legal} mono link />, getValue: (r) => r.url_normativa_o_marco_legal ?? '', onEdit: (r, v) => handleEditCell(r, 'url_normativa_o_marco_legal', v) },
    { header: 'URL terminos de uso', icon: urlIcon(), render: (r) => <TextCell value={r.url_terminos_uso} mono link />, getValue: (r) => r.url_terminos_uso ?? '', onEdit: (r, v) => handleEditCell(r, 'url_terminos_uso', v) },
    { header: 'URL aviso privacidad', icon: urlIcon(), render: (r) => <TextCell value={r.url_aviso_privacidad} mono link />, getValue: (r) => r.url_aviso_privacidad ?? '', onEdit: (r, v) => handleEditCell(r, 'url_aviso_privacidad', v) },
    { header: 'Fuente', icon: fuentesIcon(), render: (r) => r.fuente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.fuente.nombre}</span> : <span className="text-ink/60 text-[13px]">--</span>, selectOptions: fuentes.map((f) => ({ value: f.id, label: f.nombre })), onEdit: (r, v) => { updateDataset(r.id, { fuente_id: v }); const f = fuentes.find((x) => x.id === v) ?? null; setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, fuente_id: v || null, fuente: f } : i))) }, getValue: (r) => r.fuente_id ?? '' },
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
      {/* 4. Tipo de dataset */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newTipoDatasetId} onChange={setNewTipoDatasetId} options={tiposDataset.map((t) => ({ value: t.id, label: t.nombre }))} placeholder="Tipo..." label="Tipo de dataset" />
      </td>
      {/* 5. URL persistente */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlPersistente} onChange={(e) => setNewUrlPersistente(e.target.value)} onKeyDown={kd} placeholder="URL persistente..." className={inputCls} />
      </td>
      {/* 6. Periodicidad */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newPeriodicidad} onChange={(e) => setNewPeriodicidad(e.target.value)} onKeyDown={kd} placeholder="Periodicidad..." className={inputCls} />
      </td>
      {/* 7. Vigente */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newVigente} onChange={setNewVigente} options={[{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]} placeholder="Vigente..." label="Vigente" />
      </td>
      {/* 8. Desagregacion geo */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesagregacion} onChange={(e) => setNewDesagregacion(e.target.value)} onKeyDown={kd} placeholder="Desagregacion..." className={inputCls} />
      </td>
      {/* 9. Inicio cobertura temporal */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newInicioCobertura} onChange={(e) => setNewInicioCobertura(e.target.value)} onKeyDown={kd} placeholder="Inicio cobertura..." className={inputCls} />
      </td>
      {/* 10. Proposito */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newProposito} onChange={(e) => setNewProposito(e.target.value)} onKeyDown={kd} placeholder="Proposito..." className={inputCls} />
      </td>
      {/* 11. Nomenclatura edicion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newNomenclatura} onChange={(e) => setNewNomenclatura(e.target.value)} onKeyDown={kd} placeholder="Nomenclatura..." className={inputCls} />
      </td>
      {/* 12. Observaciones */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
      {/* 13. Etiquetas */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newEtiquetas} onChange={setNewEtiquetas} label="Etiquetas" />
      </td>
      {/* 14. URL normativa */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlNormativa} onChange={(e) => setNewUrlNormativa(e.target.value)} onKeyDown={kd} placeholder="URL normativa..." className={inputCls} />
      </td>
      {/* 15. URL terminos de uso */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlTerminos} onChange={(e) => setNewUrlTerminos(e.target.value)} onKeyDown={kd} placeholder="URL terminos..." className={inputCls} />
      </td>
      {/* 16. URL aviso privacidad */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlAviso} onChange={(e) => setNewUrlAviso(e.target.value)} onKeyDown={kd} placeholder="URL aviso..." className={inputCls} />
      </td>
      {/* 17. Fuente */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newFuenteId} onChange={setNewFuenteId} options={fuentes.map((f) => ({ value: f.id, label: f.nombre }))} placeholder="Fuente..." label="Fuente" />
      </td>
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="w-7 h-7 flex items-center justify-center rounded text-ink/60 hover:text-ink/80 hover:bg-ink/[5%]" aria-label="Cancelar"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg></button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Datasets" addLabel="Nuevo dataset" entityLabel="datasets" rows={filtered} columns={columns} getKey={(r) => r.id} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} />
    </div>
  )
}
