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
import type { InformacionTablas, BaseDeDatos, Producto } from '@/types'
import { TextCell } from '@/components/TextCell'
import JsonEditorInput from '@/components/JsonEditorInput'
import { JsonCell } from '@/components/JsonCell'
import { getInformacionTablas, createInformacionTabla, updateInformacionTabla, deleteInformacionTabla } from '../services/informacionTablasService'
import { getBasesDeDatos } from '@/features/bases_de_datos/services/basesDeDatosService'
import { getProductos } from '@/features/productos/services/productosService'
import { nombreIcon, descripcionIcon, basesDeDatosIcon, productosIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function InformacionTablasPage() {
  const { canWrite, canManageUsers } = useAuthContext()
  const [items, setItems] = useState<InformacionTablas[]>([])
  const [basesDeDatos, setBasesDeDatos] = useState<BaseDeDatos[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDescripcion, setNewDescripcion] = useState('')
  const [newBaseDeDatosId, setNewBaseDeDatosId] = useState('')
  const [newProductoId, setNewProductoId] = useState('')
  const [newMeta, setNewMeta] = useState<Record<string, unknown>>({})

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try {
      const [tablas, bds, prods] = await Promise.all([getInformacionTablas(), getBasesDeDatos(), getProductos()])
      setItems(tablas)
      setBasesDeDatos(bds)
      setProductos(prods)
    } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const preview = useImportPreview<InformacionTablas>('informacion_tablas', () => load(true))

  const resetFields = () => { setNewNombre(''); setNewDescripcion(''); setNewBaseDeDatosId(''); setNewProductoId(''); setNewMeta({}) }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try { await createInformacionTabla({ nombre: newNombre, descripcion: newDescripcion || undefined, base_de_datos_id: newBaseDeDatosId || undefined, producto_id: newProductoId || undefined, meta: Object.keys(newMeta).length ? newMeta : undefined }); setAddingRow(false); resetFields(); await load(true) } finally {}
  }

  const handleEditCell = (row: InformacionTablas, field: string, value: string) => {
    updateInformacionTabla(row.id, { [field]: value })
    if (field === 'base_de_datos_id') {
      const bd = basesDeDatos.find((b) => b.id === value)
      setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, base_de_datos_id: value || null, base_de_datos: bd ? { id: bd.id, db_nombre: bd.db_nombre } : null } : i)))
    } else if (field === 'producto_id') {
      const p = productos.find((x) => x.id === value)
      setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, producto_id: value || null, producto: p ? { id: p.id, nombre: p.nombre } : null } : i)))
    } else {
      setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
    }
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteInformacionTabla(id))); await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    const metaText = i.meta && Object.keys(i.meta).length ? Object.entries(i.meta).map(([k, v]) => `${k} ${String(v ?? '')}`).join(' ') : ''
    return !q || [i.nombre, i.descripcion, i.base_de_datos?.db_nombre, i.producto?.nombre, metaText].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<InformacionTablas>[] = [
    { header: 'Nombre', icon: nombreIcon(), render: (r) => <TextCell value={r.nombre} />, className: 'w-48', getValue: (r) => r.nombre, onEdit: (r, v) => handleEditCell(r, 'nombre', v) },
    { header: 'Descripción', icon: descripcionIcon(), render: (r) => <TextCell value={r.descripcion} />, getValue: (r) => r.descripcion ?? '', onEdit: (r, v) => handleEditCell(r, 'descripcion', v) },
    { header: 'Base de datos', icon: basesDeDatosIcon(), selectOptions: basesDeDatos.map((b) => ({ value: b.id, label: b.db_nombre })), onEdit: (r, v) => handleEditCell(r, 'base_de_datos_id', v), render: (r) => r.base_de_datos ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.base_de_datos.db_nombre}</span> : <span className="text-ink/60 text-[13px]">--</span>, getValue: (r) => r.base_de_datos_id ?? '' },
    { header: 'Producto', icon: productosIcon(), selectOptions: productos.map((p) => ({ value: p.id, label: p.nombre })), onEdit: (r, v) => handleEditCell(r, 'producto_id', v), render: (r) => r.producto ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.producto.nombre}</span> : <span className="text-ink/60 text-[13px]">--</span>, getValue: (r) => r.producto_id ?? '' },
    { header: 'Metadata', icon: jsonIcon(), render: (r) => <JsonCell value={r.meta} />, getValue: (r) => JSON.stringify(r.meta ?? {}), onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateInformacionTabla(r.id, { meta: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, meta: parsed } : i))) } catch {} }, inputType: 'json' },
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
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newProductoId}
          onChange={setNewProductoId}
          options={productos.map((p) => ({ value: p.id, label: p.nombre }))}
          placeholder="Producto..."
          label="Producto"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newMeta} onChange={setNewMeta} label="Meta" />
      </td>
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="w-7 h-7 flex items-center justify-center rounded text-ink/60 hover:text-ink/80 hover:bg-ink/[5%]" aria-label="Cancelar"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg></button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Catalogo" title="Información de tablas" addLabel="Nueva tabla" entityLabel="tablas" rows={filtered} columns={columns} getKey={(r) => r.id} canWrite={canWrite} onAdd={canWrite ? () => setAddingRow(true) : undefined} addRowCells={canWrite && addingRow ? addRowCells : undefined} addRowActions={canWrite && addingRow ? addRowActions : undefined} onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined} onDeleteRows={canWrite ? handleDeleteRows : undefined} search={search} onSearch={setSearch} previewRows={preview.previewRows} importSlot={canManageUsers ? (
        <div className="flex items-center gap-2">
          <ImportCsvButton entidad="informacion_tablas" loading={preview.loading} onFileSelected={preview.requestPreview} />
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
