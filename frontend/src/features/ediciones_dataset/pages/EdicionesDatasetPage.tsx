import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import ImportCsvButton from '@/components/ImportCsvButton'
import Button from '@/components/Button'
import Toast from '@/components/Toast'
import { useAuthContext } from '@/context/AuthContext'
import { useImportPreview } from '@/hooks/useImportPreview'
import type { Column } from '@/components/DataTable'
import type { EdicionDataset, Dataset, TipoPeriodo } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getEdicionesDataset, getTiposPeriodo, createEdicionDataset, createTipoPeriodo, updateEdicionDataset, deleteEdicionDataset } from '../services/edicionesDatasetService'
import { getDatasets } from '@/features/datasets/services/datasetsService'
import DatePickerInput from '@/components/DatePickerInput'
import { nombreIcon, descripcionIcon, fechaIcon, datasetsIcon, urlIcon } from '@/consts/sectionIcons'
import { DICTAMEN_OPTIONS, DICTAMEN_DESCRIPCIONES, dictamenBadgeClass, puntajeBadgeClass } from '../consts/dictamen'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function EdicionesDatasetPage() {
  const { canWrite, canManageUsers } = useAuthContext()
  const [items, setItems] = useState<EdicionDataset[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [tiposPeriodo, setTiposPeriodo] = useState<TipoPeriodo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newEdicion, setNewEdicion] = useState('')
  const [newFechaPublicacion, setNewFechaPublicacion] = useState('')
  const [newPeriodoInicio, setNewPeriodoInicio] = useState('')
  const [newPeriodoFin, setNewPeriodoFin] = useState('')
  const [newTipoPeriodoId, setNewTipoPeriodoId] = useState('')
  const [newUrlMetodologia, setNewUrlMetodologia] = useState('')
  const [newUrlMetadatos, setNewUrlMetadatos] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')
  const [newPuntaje, setNewPuntaje] = useState('')
  const [newDictamen, setNewDictamen] = useState('')
  const [newDatasetId, setNewDatasetId] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try {
      const [eds, ds, tipos] = await Promise.all([getEdicionesDataset(), getDatasets(), getTiposPeriodo()])
      setItems(eds); setDatasets(ds); setTiposPeriodo(tipos)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const preview = useImportPreview<EdicionDataset>('edicion_dataset', () => load(true))

  const resetFields = () => {
    setNewEdicion(''); setNewFechaPublicacion(''); setNewPeriodoInicio(''); setNewPeriodoFin('')
    setNewTipoPeriodoId(''); setNewUrlMetodologia(''); setNewUrlMetadatos('')
    setNewObservaciones(''); setNewPuntaje(''); setNewDictamen(''); setNewDatasetId('')
  }

  const handleSaveRow = async () => {
    if (!newEdicion.trim()) return
    try {
      await createEdicionDataset({
        edicion: newEdicion,
        dataset_id: newDatasetId || undefined,
        fecha_publicacion: newFechaPublicacion || undefined,
        periodo_referencia_inicio: newPeriodoInicio || undefined,
        periodo_referencia_fin: newPeriodoFin || undefined,
        tipo_periodo_id: newTipoPeriodoId || undefined,
        url_metodologia_edicion: newUrlMetodologia || undefined,
        url_metadatos_edicion: newUrlMetadatos || undefined,
        observaciones_edicion: newObservaciones || undefined,
        puntaje: newPuntaje !== '' ? Number(newPuntaje) : undefined,
        dictamen: newDictamen || undefined,
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
    return !q || [i.edicion, i.dataset?.nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) } catch { return d }
  }

  const tipoPeriodoOpts = tiposPeriodo.map((t) => ({ value: t.id, label: t.nombre }))

  const columns: Column<EdicionDataset>[] = [
    { header: 'Edición', icon: nombreIcon(), render: (r) => <TextCell value={r.edicion} />, className: 'w-48', getValue: (r) => r.edicion, onEdit: (r, v) => handleEditCell(r, 'edicion', v) },
    { header: 'Dataset', icon: datasetsIcon(), selectOptions: datasets.map((d) => ({ value: d.id, label: d.nombre })), onEdit: (r, v) => { updateEdicionDataset(r.id, { dataset_id: v }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, dataset_id: v || null, dataset: v ? { id: v, nombre: datasets.find((d) => d.id === v)?.nombre ?? '' } : null } : i))) }, render: (r) => r.dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.dataset.nombre}</span> : <span className="text-ink/60 text-[13px]">--</span>, getValue: (r) => r.dataset_id ?? '' },
    { header: 'Publicación', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_publicacion) ?? '--'}</span>, getValue: (r) => r.fecha_publicacion ?? '', onEdit: (r, v) => handleEditCell(r, 'fecha_publicacion', v), inputType: 'date' },
    { header: 'Tipo periodo', icon: descripcionIcon(), selectOptions: tipoPeriodoOpts, onEdit: (r, v) => { updateEdicionDataset(r.id, { tipo_periodo_id: v }); const t = tiposPeriodo.find((x) => x.id === v); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, tipo_periodo_id: v || null, tipo_periodo: t ? { id: t.id, nombre: t.nombre } : null } : i))) }, getValue: (r) => r.tipo_periodo_id ?? '', render: (r) => r.tipo_periodo ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.tipo_periodo.nombre}</span> : <span className="text-ink/60 text-[13px]">--</span> },
    { header: 'Periodo referencia inicio', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.periodo_referencia_inicio) ?? '--'}</span>, getValue: (r) => r.periodo_referencia_inicio ?? '', onEdit: (r, v) => handleEditCell(r, 'periodo_referencia_inicio', v), inputType: 'date' },
    { header: 'Periodo referencia fin', icon: fechaIcon(), render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.periodo_referencia_fin) ?? '--'}</span>, getValue: (r) => r.periodo_referencia_fin ?? '', onEdit: (r, v) => handleEditCell(r, 'periodo_referencia_fin', v), inputType: 'date' },
    { header: 'URL metodología edición', icon: urlIcon(), render: (r) => <TextCell value={r.url_metodologia_edicion} mono link />, getValue: (r) => r.url_metodologia_edicion ?? '', onEdit: (r, v) => handleEditCell(r, 'url_metodologia_edicion', v) },
    { header: 'URL metadatos edición', icon: urlIcon(), render: (r) => <TextCell value={r.url_metadatos_edicion} mono link />, getValue: (r) => r.url_metadatos_edicion ?? '', onEdit: (r, v) => handleEditCell(r, 'url_metadatos_edicion', v) },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => <TextCell value={r.observaciones_edicion} />, getValue: (r) => r.observaciones_edicion ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_edicion', v) },
    { header: 'Puntaje', icon: descripcionIcon(), inputType: 'number', getValue: (r) => r.puntaje != null ? String(r.puntaje) : '', onEdit: (r, v) => { const n = v === '' ? null : Number(v); updateEdicionDataset(r.id, { puntaje: n }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, puntaje: n } : i))) }, render: (r) => r.puntaje != null ? <span className={puntajeBadgeClass(r.puntaje)}>{r.puntaje}</span> : <span className="text-ink/60 text-[13px]">--</span> },
    { header: 'Dictamen', icon: descripcionIcon(), selectOptions: DICTAMEN_OPTIONS, onEdit: (r, v) => { updateEdicionDataset(r.id, { dictamen: v || null }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, dictamen: v || null } : i))) }, getValue: (r) => r.dictamen ?? '', render: (r) => r.dictamen ? <span className={dictamenBadgeClass(r.dictamen)} title={DICTAMEN_DESCRIPCIONES[r.dictamen]}>{r.dictamen}</span> : <span className="text-ink/60 text-[13px]">--</span> },
  ]

  const addRowCells = (
    <>
      {/* 1. Edicion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newEdicion} onChange={(e) => setNewEdicion(e.target.value)} onKeyDown={kd} placeholder="Edicion..." className={inputCls} />
      </td>
      {/* 2. Dataset */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newDatasetId} onChange={setNewDatasetId} options={datasets.map((d) => ({ value: d.id, label: d.nombre }))} placeholder="Dataset..." label="Dataset" />
      </td>
      {/* 3. Publicacion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newFechaPublicacion} onChange={setNewFechaPublicacion} placeholder="Publicacion..." onKeyDown={kd} />
      </td>
      {/* 4. Tipo periodo (catálogo con opción de crear) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newTipoPeriodoId}
          onChange={setNewTipoPeriodoId}
          options={tipoPeriodoOpts}
          placeholder="Tipo periodo..."
          label="Tipo de periodo"
          createPlaceholder="Nuevo tipo…"
          onCreate={async (nombre) => {
            const t = await createTipoPeriodo({ nombre })
            setTiposPeriodo((prev) => [...prev, t])
            setNewTipoPeriodoId(t.id)
          }}
        />
      </td>
      {/* 5. Periodo inicio */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newPeriodoInicio} onChange={setNewPeriodoInicio} placeholder="Periodo inicio..." onKeyDown={kd} />
      </td>
      {/* 6. Periodo fin */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newPeriodoFin} onChange={setNewPeriodoFin} placeholder="Periodo fin..." onKeyDown={kd} />
      </td>
      {/* 7. URL metodologia */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlMetodologia} onChange={(e) => setNewUrlMetodologia(e.target.value)} onKeyDown={kd} placeholder="URL metodologia..." className={inputCls} />
      </td>
      {/* 8. URL metadatos */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlMetadatos} onChange={(e) => setNewUrlMetadatos(e.target.value)} onKeyDown={kd} placeholder="URL metadatos..." className={inputCls} />
      </td>
      {/* 9. Observaciones */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
      {/* 10. Puntaje */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="number" min={0} max={100} step={0.1} value={newPuntaje} onChange={(e) => setNewPuntaje(e.target.value)} onKeyDown={kd} placeholder="Puntaje..." className={inputCls} />
      </td>
      {/* 11. Dictamen (catálogo fijo A1..C) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newDictamen} onChange={setNewDictamen} options={DICTAMEN_OPTIONS} placeholder="Dictamen..." label="Dictamen" />
      </td>
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="w-7 h-7 flex items-center justify-center rounded text-ink/60 hover:text-ink/80 hover:bg-ink/[5%]" aria-label="Cancelar"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg></button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Ediciones de dataset" addLabel="Nueva edicion" entityLabel="ediciones" rows={filtered} columns={columns} getKey={(r) => r.id} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} previewRows={preview.previewRows} importSlot={canManageUsers ? (
        <div className="flex items-center gap-2">
          <ImportCsvButton entidad="edicion_dataset" loading={preview.loading} onFileSelected={preview.requestPreview} />
          {preview.active && !preview.bloqueo && (
            <span className="text-[12px] text-ink/50">
              {preview.previewRows.length} a crear, {preview.duplicadosPreview} se omitirían por duplicado
            </span>
          )}
          {preview.active && (
            <>
              <Button size="sm" onClick={preview.confirm} disabled={!!preview.bloqueo || preview.loading}>Confirmar import</Button>
              <Button size="sm" variant="secondary" onClick={preview.cancel}>Cancelar</Button>
            </>
          )}
        </div>
      ) : undefined} />
      {preview.bloqueo && <p className="text-[13px] text-error-600 mt-2">{preview.bloqueo}</p>}
      {preview.resultado && (
        <Toast
          message={`${preview.resultado.creados} creados, ${preview.resultado.omitidos_duplicados.length} omitidos por duplicado`}
          variant="success"
          onClose={preview.clearResultado}
        />
      )}
    </div>
  )
}
