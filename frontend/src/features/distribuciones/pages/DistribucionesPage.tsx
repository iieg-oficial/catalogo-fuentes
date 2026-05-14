import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Distribucion, EdicionDataset } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getDistribuciones, createDistribucion, updateDistribucion, deleteDistribucion } from '../services/distribucionesService'
import { getEdicionesDataset } from '@/features/ediciones_dataset/services/edicionesDatasetService'
import { nombreIcon, descripcionIcon, estadoIcon, edicionesIcon, urlIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function DistribucionesPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Distribucion[]>([])
  const [ediciones, setEdiciones] = useState<EdicionDataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newDescriptor, setNewDescriptor] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newEdicionId, setNewEdicionId] = useState('')
  const [newReqAuth, setNewReqAuth] = useState('')
  const [newReqRegistro, setNewReqRegistro] = useState('')
  const [newUrlPersistente, setNewUrlPersistente] = useState('')
  const [newEstadoUrl, setNewEstadoUrl] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try {
      const [dist, eds] = await Promise.all([getDistribuciones(), getEdicionesDataset()])
      setItems(dist)
      setEdiciones(eds)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewDescriptor(''); setNewUrl(''); setNewEdicionId(''); setNewReqAuth('')
    setNewReqRegistro(''); setNewUrlPersistente(''); setNewEstadoUrl(''); setNewObservaciones('')
  }

  const handleSaveRow = async () => {
    if (!newDescriptor.trim()) return
    try {
      await createDistribucion({
        descriptor: newDescriptor,
        url: newUrl || undefined,
        edicion_dataset_id: newEdicionId || undefined,
        requiere_autenticacion: newReqAuth ? newReqAuth === 'true' : undefined,
        requiere_registro: newReqRegistro ? newReqRegistro === 'true' : undefined,
        es_url_persistente: newUrlPersistente ? newUrlPersistente === 'true' : undefined,
        estado_url_ultima_revision: newEstadoUrl || undefined,
        observaciones_distribucion: newObservaciones || undefined,
      })
      setAddingRow(false); resetFields(); await load(true)
    } finally {}
  }

  const handleEditCell = (row: Distribucion, field: string, value: string | boolean) => {
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

  const boolOpts = [{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]
  const edicionOpts = ediciones.map((e) => ({ value: e.id, label: e.nombre }))

  const columns: Column<Distribucion>[] = [
    { header: 'Descripción', icon: nombreIcon(), render: (r) => <TextCell value={r.descriptor ?? r.id.slice(0, 8)} />, className: 'w-48', getValue: (r) => r.descriptor ?? '', onEdit: (r, v) => handleEditCell(r, 'descriptor', v) },
    { header: 'URL', icon: urlIcon(), render: (r) => <TextCell value={r.url} mono link />, getValue: (r) => r.url ?? '', onEdit: (r, v) => handleEditCell(r, 'url', v) },
    { header: 'Edición', icon: edicionesIcon(), selectOptions: edicionOpts, onEdit: (r, v) => handleEditCell(r, 'edicion_dataset_id', v), getValue: (r) => r.edicion_dataset_id ?? '', render: (r) => r.edicion_dataset ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.edicion_dataset.nombre}</span> : <span className="text-ink/30 text-[13px]">--</span> },
    { header: 'Req. autenticacion', icon: estadoIcon(), selectOptions: boolOpts, onEdit: (r, v) => handleEditCell(r, 'requiere_autenticacion', v === 'true'), getValue: (r) => r.requiere_autenticacion ? 'true' : 'false', render: (r) => r.requiere_autenticacion ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span> },
    { header: 'Req. registro', icon: estadoIcon(), selectOptions: boolOpts, onEdit: (r, v) => handleEditCell(r, 'requiere_registro', v === 'true'), getValue: (r) => r.requiere_registro ? 'true' : 'false', render: (r) => r.requiere_registro ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span> },
    { header: 'URL persistente', icon: estadoIcon(), selectOptions: boolOpts, onEdit: (r, v) => handleEditCell(r, 'es_url_persistente', v === 'true'), getValue: (r) => r.es_url_persistente ? 'true' : 'false', render: (r) => r.es_url_persistente ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span> : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span> },
    { header: 'Estado URL última revisión', icon: descripcionIcon(), render: (r) => <TextCell value={r.estado_url_ultima_revision} />, getValue: (r) => r.estado_url_ultima_revision ?? '', onEdit: (r, v) => handleEditCell(r, 'estado_url_ultima_revision', v) },
    { header: 'Observaciones', icon: descripcionIcon(), render: (r) => <TextCell value={r.observaciones_distribucion} />, getValue: (r) => r.observaciones_distribucion ?? '', onEdit: (r, v) => handleEditCell(r, 'observaciones_distribucion', v) },
  ]

  /* 8 columns: Descripcion, URL, Edicion, Req. autenticacion, Req. registro, URL persistente, Estado URL, Observaciones */
  const addRowCells = (
    <>
      {/* 1. Descripcion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newDescriptor} onChange={(e) => setNewDescriptor(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      {/* 2. URL */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={kd} placeholder="URL..." className={inputCls} />
      </td>
      {/* 3. Edicion (FK select) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newEdicionId} onChange={setNewEdicionId} options={edicionOpts} placeholder="Edicion..." label="Edicion" />
      </td>
      {/* 4. Req. autenticacion */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newReqAuth} onChange={setNewReqAuth} options={boolOpts} placeholder="Req. Auth..." label="Req. autenticacion" />
      </td>
      {/* 5. Req. registro */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newReqRegistro} onChange={setNewReqRegistro} options={boolOpts} placeholder="Req. Registro..." label="Req. registro" />
      </td>
      {/* 6. URL persistente */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newUrlPersistente} onChange={setNewUrlPersistente} options={boolOpts} placeholder="URL persist..." label="URL persistente" />
      </td>
      {/* 7. Estado URL */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newEstadoUrl} onChange={(e) => setNewEstadoUrl(e.target.value)} onKeyDown={kd} placeholder="Estado URL..." className={inputCls} />
      </td>
      {/* 8. Observaciones */}
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
