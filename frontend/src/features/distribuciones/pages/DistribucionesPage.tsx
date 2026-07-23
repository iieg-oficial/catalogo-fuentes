import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import ImportControls from '@/components/ImportControls'
import { useAuthContext } from '@/context/AuthContext'
import { useImportPreview } from '@/hooks/useImportPreview'
import type { Column } from '@/components/DataTable'
import type { Dataset, Distribucion, EdicionDataset, TipoDeAcceso } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getDistribuciones, getTiposDeAcceso, createDistribucion, updateDistribucion, deleteDistribucion } from '../services/distribucionesService'
import { getEdicionesDataset } from '@/features/ediciones_dataset/services/edicionesDatasetService'
import { getDatasets } from '@/features/datasets/services/datasetsService'
import { nombreIcon, descripcionIcon, estadoIcon, edicionesIcon, datasetsIcon, urlIcon } from '@/consts/sectionIcons'
import { VIEW_ONLY_COLOR } from '@/consts/colors'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function DistribucionesPage() {
  const { canWrite, canManageUsers } = useAuthContext()
  const [items, setItems] = useState<Distribucion[]>([])
  const [ediciones, setEdiciones] = useState<EdicionDataset[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [tiposAcceso, setTiposAcceso] = useState<TipoDeAcceso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newDistribucion, setNewDistribucion] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newEdicionId, setNewEdicionId] = useState('')
  const [newDatasetId, setNewDatasetId] = useState('')
  const [newTipoAccesoId, setNewTipoAccesoId] = useState('')
  const [newReqControl, setNewReqControl] = useState('')
  const [newUrlPersistente, setNewUrlPersistente] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try {
      const [dist, eds, ds, tipos] = await Promise.all([
        getDistribuciones(), getEdicionesDataset(), getDatasets(), getTiposDeAcceso(),
      ])
      setItems(dist)
      setEdiciones(eds)
      setDatasets(ds)
      setTiposAcceso(tipos)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const preview = useImportPreview<Distribucion>('distribucion', () => load(true))

  const resetFields = () => {
    setNewDistribucion(''); setNewUrl(''); setNewEdicionId(''); setNewDatasetId('')
    setNewTipoAccesoId(''); setNewReqControl('')
    setNewUrlPersistente(''); setNewObservaciones('')
  }

  const handleSaveRow = async () => {
    if (!newDistribucion.trim()) return
    try {
      await createDistribucion({
        distribucion: newDistribucion,
        url: newUrl || undefined,
        edicion_dataset_id: newEdicionId || undefined,
        dataset_id: newDatasetId || undefined,
        tipo_de_acceso_id: newTipoAccesoId || undefined,
        requiere_control_de_acceso: newReqControl ? newReqControl === 'true' : undefined,
        es_url_persistente: newUrlPersistente ? newUrlPersistente === 'true' : undefined,
        observaciones_distribucion: newObservaciones || undefined,
      })
      setAddingRow(false); resetFields(); await load(true)
    } finally {}
  }

  // Patch the server-computed identifier back into local state after an edit.
  const patchLabel = (id: string, label: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, distribucion_label: label } : i)))

  const handleEditCell = (row: Distribucion, field: string, value: string | boolean) => {
    updateDistribucion(row.id, { [field]: value }).then((u) => patchLabel(row.id, u.distribucion_label))
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteDistribucion(id))); await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.distribucion, i.url, i.edicion_dataset?.edicion, i.dataset?.nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const boolOpts = [{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]
  const edicionOpts = ediciones.map((e) => ({ value: e.id, label: e.edicion }))
  const datasetOpts = datasets.map((d) => ({ value: d.id, label: d.nombre }))
  const tipoAccesoOpts = tiposAcceso.map((t) => ({ value: t.id, label: t.nombre }))

  const columns: Column<Distribucion>[] = [
    { header: 'Identificador', icon: nombreIcon(), render: (r) => <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium" style={{ backgroundColor: `${VIEW_ONLY_COLOR}1a`, color: VIEW_ONLY_COLOR }}>{r.distribucion_label}</span>, className: 'w-56', getValue: (r) => r.distribucion_label },
    { header: 'Distribución', icon: nombreIcon(), render: (r) => <TextCell value={r.distribucion ?? r.id.slice(0, 8)} />, className: 'w-48', getValue: (r) => r.distribucion ?? '', onEdit: (r, v) => handleEditCell(r, 'distribucion', v) },
    { header: 'Edición data set', icon: edicionesIcon(), selectOptions: edicionOpts, onEdit: (r, v) => { updateDistribucion(r.id, { edicion_dataset_id: v }).then((u) => patchLabel(r.id, u.distribucion_label)); const e = ediciones.find((x) => x.id === v); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, edicion_dataset_id: v || null, edicion_dataset: e ? { id: e.id, edicion: e.edicion } : null } : i))) }, getValue: (r) => r.edicion_dataset_id ?? '', render: (r) => r.edicion_dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.edicion_dataset.edicion}</span> : <span className="text-ink/60 text-[13px]">--</span> },
    { header: 'Dataset', icon: datasetsIcon(), selectOptions: datasetOpts, onEdit: (r, v) => { updateDistribucion(r.id, { dataset_id: v }).then((u) => patchLabel(r.id, u.distribucion_label)); const d = datasets.find((x) => x.id === v); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, dataset_id: v || null, dataset: d ? { id: d.id, nombre: d.nombre } : null } : i))) }, getValue: (r) => r.dataset_id ?? '', render: (r) => r.dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.dataset.nombre}</span> : <span className="text-ink/60 text-[13px]">--</span> },
    { header: 'URL', icon: urlIcon(), render: (r) => <TextCell value={r.url} mono link />, getValue: (r) => r.url ?? '', onEdit: (r, v) => handleEditCell(r, 'url', v) },
    { header: 'Tipo de acceso', icon: estadoIcon(), selectOptions: tipoAccesoOpts, onEdit: (r, v) => { updateDistribucion(r.id, { tipo_de_acceso_id: v }); const t = tiposAcceso.find((x) => x.id === v); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, tipo_de_acceso_id: v || null, tipo_de_acceso: t ? { id: t.id, nombre: t.nombre } : null } : i))) }, getValue: (r) => r.tipo_de_acceso_id ?? '', render: (r) => r.tipo_de_acceso ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.tipo_de_acceso.nombre}</span> : <span className="text-ink/60 text-[13px]">--</span> },
    { header: 'Req. control de acceso', icon: estadoIcon(), selectOptions: boolOpts, onEdit: (r, v) => handleEditCell(r, 'requiere_control_de_acceso', v === 'true'), getValue: (r) => r.requiere_control_de_acceso ? 'true' : 'false', render: (r) => r.requiere_control_de_acceso ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span> },
    { header: 'Es URL persistente', icon: estadoIcon(), selectOptions: boolOpts, onEdit: (r, v) => handleEditCell(r, 'es_url_persistente', v === 'true'), getValue: (r) => r.es_url_persistente ? 'true' : 'false', render: (r) => r.es_url_persistente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span> },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => <TextCell value={r.observaciones_distribucion} />, getValue: (r) => r.observaciones_distribucion ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_distribucion', v) },
  ]

  const addRowCells = (
    <>
      {/* 1. Identificador (derivado, no editable) */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <span className="text-ink/40 text-[13px] italic">Se genera al guardar</span>
      </td>
      {/* 2. Distribucion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newDistribucion} onChange={(e) => setNewDistribucion(e.target.value)} onKeyDown={kd} placeholder="Distribucion..." className={inputCls} />
      </td>
      {/* 3. Edicion data set (FK select) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newEdicionId} onChange={setNewEdicionId} options={edicionOpts} placeholder="Edicion data set..." label="Edicion data set" />
      </td>
      {/* 3. Dataset (FK select) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newDatasetId} onChange={setNewDatasetId} options={datasetOpts} placeholder="Dataset..." label="Dataset" />
      </td>
      {/* 4. URL */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={kd} placeholder="URL..." className={inputCls} />
      </td>
      {/* 5. Tipo de acceso (FK select) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newTipoAccesoId} onChange={setNewTipoAccesoId} options={tipoAccesoOpts} placeholder="Tipo acceso..." label="Tipo de acceso" />
      </td>
      {/* 7. Req. control de acceso */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newReqControl} onChange={setNewReqControl} options={boolOpts} placeholder="Req. control..." label="Req. control de acceso" />
      </td>
      {/* 8. Es URL persistente */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newUrlPersistente} onChange={setNewUrlPersistente} options={boolOpts} placeholder="Es URL persist..." label="Es URL persistente" />
      </td>
      {/* 9. Observaciones */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="w-7 h-7 flex items-center justify-center rounded text-ink/60 hover:text-ink/80 hover:bg-ink/[5%]" aria-label="Cancelar"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg></button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Distribuciones" addLabel="Nueva distribucion" entityLabel="distribuciones" rows={filtered} columns={columns} getKey={(r) => r.id} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} previewRows={preview.previewRows} importSlot={canManageUsers ? <ImportControls preview={preview} entidad="distribucion" /> : undefined} />
    </div>
  )
}
