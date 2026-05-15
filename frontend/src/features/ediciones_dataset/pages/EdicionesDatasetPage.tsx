import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { EdicionDataset, Dataset } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getEdicionesDataset, createEdicionDataset, updateEdicionDataset, deleteEdicionDataset } from '../services/edicionesDatasetService'
import { getDatasets } from '@/features/datasets/services/datasetsService'
import DatePickerInput from '@/components/DatePickerInput'
import { nombreIcon, descripcionIcon, fechaIcon, datasetsIcon, estadoIcon, urlIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function EdicionesDatasetPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<EdicionDataset[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newFechaPublicacion, setNewFechaPublicacion] = useState('')
  const [newPeriodoInicio, setNewPeriodoInicio] = useState('')
  const [newPeriodoFin, setNewPeriodoFin] = useState('')
  const [newTipoPeriodo, setNewTipoPeriodo] = useState('')
  const [newLevantamientoInicio, setNewLevantamientoInicio] = useState('')
  const [newLevantamientoFin, setNewLevantamientoFin] = useState('')
  const [newUrlDocumentacion, setNewUrlDocumentacion] = useState('')
  const [newUrlComunicado, setNewUrlComunicado] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')
  const [newVersionPublicacion, setNewVersionPublicacion] = useState('')
  const [newEsCorregida, setNewEsCorregida] = useState('')
  const [newDatasetId, setNewDatasetId] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try {
      const [eds, ds] = await Promise.all([getEdicionesDataset(), getDatasets()])
      setItems(eds); setDatasets(ds)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewNombre(''); setNewFechaPublicacion(''); setNewPeriodoInicio(''); setNewPeriodoFin('')
    setNewTipoPeriodo(''); setNewLevantamientoInicio(''); setNewLevantamientoFin('')
    setNewUrlDocumentacion(''); setNewUrlComunicado(''); setNewObservaciones('')
    setNewVersionPublicacion(''); setNewEsCorregida(''); setNewDatasetId('')
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createEdicionDataset({
        nombre: newNombre,
        dataset_id: newDatasetId || undefined,
        fecha_publicacion: newFechaPublicacion || undefined,
        periodo_referencia_inicio: newPeriodoInicio || undefined,
        periodo_referencia_fin: newPeriodoFin || undefined,
        tipo_periodo_referencia: newTipoPeriodo || undefined,
        fecha_levantamiento_inicio: newLevantamientoInicio || undefined,
        fecha_levantamiento_fin: newLevantamientoFin || undefined,
        url_documentacion_edicion: newUrlDocumentacion || undefined,
        url_comunicado_publicacion: newUrlComunicado || undefined,
        observaciones_edicion: newObservaciones || undefined,
        version_publicacion: newVersionPublicacion || undefined,
        es_version_corregida: newEsCorregida ? newEsCorregida === 'true' : undefined,
      })
      setAddingRow(false); resetFields(); await load(true)
    } finally {}
  }

  const handleEditCell = (row: EdicionDataset, field: string, value: string | boolean) => {
    updateEdicionDataset(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
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
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) } catch { return d }
  }


  const boolOpts = [{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]

  const columns: Column<EdicionDataset>[] = [
    { header: 'Edición', icon: nombreIcon(), render: (r) => <TextCell value={r.nombre} />, className: 'w-48', getValue: (r) => r.nombre, onEdit: (r, v) => handleEditCell(r, 'nombre', v) },
    { header: 'Dataset', icon: datasetsIcon(), selectOptions: datasets.map((d) => ({ value: d.id, label: d.nombre })), onEdit: (r, v) => { updateEdicionDataset(r.id, { dataset_id: v }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, dataset_id: v || null, dataset: v ? { id: v, nombre: datasets.find((d) => d.id === v)?.nombre ?? '' } : null } : i))) }, render: (r) => r.dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.dataset.nombre}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.dataset_id ?? '' },
    { header: 'Publicación', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_publicacion) ?? '--'}</span>, getValue: (r) => r.fecha_publicacion ?? '', onEdit: (r, v) => handleEditCell(r, 'fecha_publicacion', v), inputType: 'date' },
    { header: 'Periodo referencia inicio', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.periodo_referencia_inicio) ?? '--'}</span>, getValue: (r) => r.periodo_referencia_inicio ?? '', onEdit: (r, v) => handleEditCell(r, 'periodo_referencia_inicio', v), inputType: 'date' },
    { header: 'Periodo referencia fin', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.periodo_referencia_fin) ?? '--'}</span>, getValue: (r) => r.periodo_referencia_fin ?? '', onEdit: (r, v) => handleEditCell(r, 'periodo_referencia_fin', v), inputType: 'date' },
    { header: 'Tipo periodo', icon: descripcionIcon(), render: (r) => <TextCell value={r.tipo_periodo_referencia} />, getValue: (r) => r.tipo_periodo_referencia ?? '', onEdit: (r, v) => handleEditCell(r, 'tipo_periodo_referencia', v) },
    { header: 'Fecha levantamiento inicio', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_levantamiento_inicio) ?? '--'}</span>, getValue: (r) => r.fecha_levantamiento_inicio ?? '', onEdit: (r, v) => handleEditCell(r, 'fecha_levantamiento_inicio', v), inputType: 'date' },
    { header: 'Fecha levantamiento fin', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_levantamiento_fin) ?? '--'}</span>, getValue: (r) => r.fecha_levantamiento_fin ?? '', onEdit: (r, v) => handleEditCell(r, 'fecha_levantamiento_fin', v), inputType: 'date' },
    { header: 'URL documentación edición', icon: urlIcon(), render: (r) => <TextCell value={r.url_documentacion_edicion} mono link />, getValue: (r) => r.url_documentacion_edicion ?? '', onEdit: (r, v) => handleEditCell(r, 'url_documentacion_edicion', v) },
    { header: 'URL comunicado edición', icon: urlIcon(), render: (r) => <TextCell value={r.url_comunicado_publicacion} mono link />, getValue: (r) => r.url_comunicado_publicacion ?? '', onEdit: (r, v) => handleEditCell(r, 'url_comunicado_publicacion', v) },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => <TextCell value={r.observaciones_edicion} />, getValue: (r) => r.observaciones_edicion ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_edicion', v) },
    { header: 'Versión', icon: descripcionIcon(), render: (r) => <TextCell value={r.version_publicacion} />, getValue: (r) => r.version_publicacion ?? '', onEdit: (r, v) => handleEditCell(r, 'version_publicacion', v) },
    { header: 'Corregida', icon: estadoIcon(), selectOptions: boolOpts, onEdit: (r, v) => handleEditCell(r, 'es_version_corregida', v === 'true'), getValue: (r) => r.es_version_corregida ? 'true' : 'false', render: (r) => r.es_version_corregida ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span> },
  ]

  const addRowCells = (
    <>
      {/* 1. Nombre */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      {/* 2. Dataset */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newDatasetId} onChange={setNewDatasetId} options={datasets.map((d) => ({ value: d.id, label: d.nombre }))} placeholder="Dataset..." label="Dataset" />
      </td>
      {/* 3. Publicacion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newFechaPublicacion} onChange={setNewFechaPublicacion} placeholder="Publicacion..." onKeyDown={kd} />
      </td>
      {/* 4. Periodo inicio */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newPeriodoInicio} onChange={setNewPeriodoInicio} placeholder="Periodo inicio..." onKeyDown={kd} />
      </td>
      {/* 5. Periodo fin */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newPeriodoFin} onChange={setNewPeriodoFin} placeholder="Periodo fin..." onKeyDown={kd} />
      </td>
      {/* 6. Tipo periodo */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newTipoPeriodo} onChange={(e) => setNewTipoPeriodo(e.target.value)} onKeyDown={kd} placeholder="Tipo periodo..." className={inputCls} />
      </td>
      {/* 7. Levantamiento inicio */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newLevantamientoInicio} onChange={setNewLevantamientoInicio} placeholder="Lev. inicio..." onKeyDown={kd} />
      </td>
      {/* 8. Levantamiento fin */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newLevantamientoFin} onChange={setNewLevantamientoFin} placeholder="Lev. fin..." onKeyDown={kd} />
      </td>
      {/* 9. URL documentacion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlDocumentacion} onChange={(e) => setNewUrlDocumentacion(e.target.value)} onKeyDown={kd} placeholder="URL doc..." className={inputCls} />
      </td>
      {/* 10. URL comunicado */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlComunicado} onChange={(e) => setNewUrlComunicado(e.target.value)} onKeyDown={kd} placeholder="URL comunicado..." className={inputCls} />
      </td>
      {/* 11. Observaciones */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
      {/* 12. Version */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newVersionPublicacion} onChange={(e) => setNewVersionPublicacion(e.target.value)} onKeyDown={kd} placeholder="Version..." className={inputCls} />
      </td>
      {/* 13. Corregida */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newEsCorregida} onChange={setNewEsCorregida} options={boolOpts} placeholder="Corregida..." label="Corregida" />
      </td>
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
