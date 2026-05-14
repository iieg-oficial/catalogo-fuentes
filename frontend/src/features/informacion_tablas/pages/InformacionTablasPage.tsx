import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { InformacionTablas, BaseDeDatos } from '@/types'
import { TextCell } from '@/components/TextCell'
import JsonEditorInput from '@/components/JsonEditorInput'
import { JsonCell } from '@/components/JsonCell'
import { getInformacionTablas, createInformacionTabla, updateInformacionTabla, deleteInformacionTabla } from '../services/informacionTablasService'
import { getBasesDeDatos } from '@/features/bases_de_datos/services/basesDeDatosService'
import { nombreIcon, descripcionIcon, basesDeDatosIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function InformacionTablasPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<InformacionTablas[]>([])
  const [basesDeDatos, setBasesDeDatos] = useState<BaseDeDatos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDescripcion, setNewDescripcion] = useState('')
  const [newBaseDeDatosId, setNewBaseDeDatosId] = useState('')
  const [newMeta, setNewMeta] = useState<Record<string, unknown>>({})

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try {
      const [tablas, bds] = await Promise.all([getInformacionTablas(), getBasesDeDatos()])
      setItems(tablas)
      setBasesDeDatos(bds)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewDescripcion(''); setNewBaseDeDatosId(''); setNewMeta({}) }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try { await createInformacionTabla({ nombre: newNombre, descripcion: newDescripcion || undefined, base_de_datos_id: newBaseDeDatosId || undefined, meta: Object.keys(newMeta).length ? newMeta : undefined }); setAddingRow(false); resetFields(); await load(true) } finally {}
  }

  const handleEditCell = (row: InformacionTablas, field: string, value: string) => {
    updateInformacionTabla(row.id, { [field]: value })
    if (field === 'base_de_datos_id') {
      const bd = basesDeDatos.find((b) => b.id === value)
      setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, base_de_datos_id: value || null, base_de_datos: bd ? { id: bd.id, db_nombre: bd.db_nombre } : null } : i)))
    } else {
      setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
    }
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteInformacionTabla(id))); await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.descripcion, i.base_de_datos?.db_nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<InformacionTablas>[] = [
    { header: 'Nombre', icon: nombreIcon(), render: (r) => <TextCell value={r.nombre} />, className: 'w-48', getValue: (r) => r.nombre, onEdit: (r, v) => handleEditCell(r, 'nombre', v) },
    { header: 'Descripcion', icon: descripcionIcon(), render: (r) => <TextCell value={r.descripcion} />, getValue: (r) => r.descripcion ?? '', onEdit: (r, v) => handleEditCell(r, 'descripcion', v) },
    { header: 'Base de datos', icon: basesDeDatosIcon(), selectOptions: basesDeDatos.map((b) => ({ value: b.id, label: b.db_nombre })), onEdit: (r, v) => handleEditCell(r, 'base_de_datos_id', v), render: (r) => r.base_de_datos ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.base_de_datos.db_nombre}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.base_de_datos_id ?? '' },
    { header: 'Meta', icon: jsonIcon(), render: (r) => <JsonCell value={r.meta} />, getValue: (r) => JSON.stringify(r.meta ?? {}), onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateInformacionTabla(r.id, { meta: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, meta: parsed } : i))) } catch {} }, inputType: 'json' },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDescripcion} onChange={(e) => setNewDescripcion(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newBaseDeDatosId}
          onChange={setNewBaseDeDatosId}
          options={basesDeDatos.map((b) => ({ value: b.id, label: b.db_nombre }))}
          placeholder="Base de datos..."
          label="Base de datos"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newMeta} onChange={setNewMeta} label="Meta" />
      </td>
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">x</button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Informacion de tablas" addLabel="Nueva tabla" entityLabel="tablas" rows={filtered} columns={columns} getKey={(r) => r.id} onRowClick={(r) => navigate(`/informacion-tablas/${r.id}`)} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} />
    </div>
  )
}
