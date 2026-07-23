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
import type { Dataset, Producto, Proyecto } from '@/types'
import { TextCell } from '@/components/TextCell'
import TagPills from '@/components/TagPills'
import JsonEditorInput from '@/components/JsonEditorInput'
import { JsonCell } from '@/components/JsonCell'
import { getProductos, createProducto, updateProducto, deleteProducto, getAllProductoDatasets } from '../services/productosService'
import { getProyectos } from '@/features/proyectos/services/proyectosService'
import { nombreIcon, descripcionIcon, proyectosIcon, jsonIcon } from '@/consts/sectionIcons'
import { VIEW_ONLY_COLOR } from '@/consts/colors'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ProductosPage() {
  const { canWrite, canManageUsers } = useAuthContext()
  const [items, setItems] = useState<Producto[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newProyectoId, setNewProyectoId] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newMeta, setNewMeta] = useState<Record<string, unknown>>({})
  const [datasetsByProducto, setDatasetsByProducto] = useState<Record<string, Dataset[]>>({})

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [prods, projs, datasets] = await Promise.all([getProductos(), getProyectos(), getAllProductoDatasets()])
      setItems(prods)
      setProyectos(projs)
      setDatasetsByProducto(datasets)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const preview = useImportPreview<Producto>('producto', () => load(true))

  const resetFields = () => { setNewNombre(''); setNewProyectoId(''); setNewDesc(''); setNewMeta({}) }

  const handleSaveRow = async () => {
    if (!newNombre.trim() || !newProyectoId) return
    try {
      await createProducto({ nombre: newNombre, proyecto_id: newProyectoId, descripcion: newDesc || undefined, meta: Object.keys(newMeta).length ? newMeta : undefined })
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditPrimaryCell = (row: Producto, field: 'nombre' | 'descripcion', value: string) => {
    updateProducto(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleEditProyecto = (row: Producto, proyectoId: string) => {
    const proyecto = proyectos.find((p) => p.id === proyectoId) ?? null
    updateProducto(row.id, { proyecto_id: proyectoId })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, proyecto_id: proyectoId, proyecto } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteProducto(id)))
    await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.descripcion, i.proyecto?.nombre].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Producto>[] = [
    {
      header: 'Nombre',
      icon: nombreIcon(),
      render: (r) => <TextCell value={r.nombre} />,
      className: 'w-56',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Proyecto',
      icon: proyectosIcon(),
      render: (r) => r.proyecto
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.proyecto.nombre}</span>
        : <span className="text-ink/60 text-[13px]">--</span>,
      getValue: (r) => r.proyecto?.id ?? '',
      onEdit: handleEditProyecto,
      selectOptions: proyectos.map((p) => ({ value: p.id, label: p.nombre })),
    },
    {
      header: 'Descripción',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.descripcion} />,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
    {
      header: 'Datasets',
      icon: jsonIcon(),
      render: (r) => {
        const names = (datasetsByProducto[r.id] ?? []).map((d) => d.nombre)
        return <TagPills items={names} label="DATASETS" color={VIEW_ONLY_COLOR} />
      },
      className: 'w-64',
    },
    {
      header: 'Metadata',
      icon: jsonIcon(),
      render: (r) => <JsonCell value={r.meta} />,
      getValue: (r) => JSON.stringify(r.meta ?? {}),
      onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateProducto(r.id, { meta: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, meta: parsed } : i))) } catch {} },
      inputType: 'json',
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newProyectoId}
          onChange={setNewProyectoId}
          options={proyectos.map((p) => ({ value: p.id, label: p.nombre }))}
          placeholder="Proyecto..."
          label="Proyecto"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newMeta} onChange={setNewMeta} label="Meta" />
      </td>
    </>
  )

  const addRowActions = (
    <button onClick={() => { setAddingRow(false); resetFields() }} className="w-7 h-7 flex items-center justify-center rounded text-ink/60 hover:text-ink/80 hover:bg-ink/[5%]" aria-label="Cancelar"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg></button>
  )

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid
        eyebrow="Catalogo"
        title="Productos"
        addLabel="Nuevo producto"
        entityLabel="productos"
        rows={filtered}
        columns={columns}
        getKey={(r) => r.id}
        canWrite={canWrite}
        onAdd={canWrite ? () => setAddingRow(true) : undefined}
        addRowCells={canWrite && addingRow ? addRowCells : undefined}
        addRowActions={canWrite && addingRow ? addRowActions : undefined}
        onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined}
        onDeleteRows={canWrite ? handleDeleteRows : undefined}
        search={search}
        onSearch={setSearch}
        previewRows={preview.previewRows}
        importSlot={canManageUsers ? <ImportControls preview={preview} entidad="producto" /> : undefined}
      />
    </div>
  )
}
