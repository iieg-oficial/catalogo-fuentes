import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import ColFormModal from '@/components/ColFormModal'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns, type ColumnType, type ListOption, type MetaColumnDef } from '@/hooks/useMetaColumns'
import type { Column } from '@/components/DataTable'
import type { Producto, Proyecto } from '@/types'
import { getProductos, createProducto, updateProducto, deleteProducto } from './services/productosService'
import { getProyectos } from '@/features/proyectos/services/proyectosService'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ProductosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Producto[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [showColForm, setShowColForm] = useState(false)
  const [editingColKey, setEditingColKey] = useState<string | null>(null)
  const [colName, setColName] = useState('')
  const [colType, setColType] = useState<ColumnType>('text')
  const [colListOptions, setColListOptions] = useState<ListOption[]>([])
  const [colColor, setColColor] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newProyectoId, setNewProyectoId] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const { allMetaCols, addColumn, deleteColumn, updateColumn, getMeta } = useMetaColumns(items, 'productos')

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [prods, projs] = await Promise.all([getProductos(), getProyectos()])
      setItems(prods)
      setProyectos(projs)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewProyectoId(''); setNewDesc(''); setAddRowMeta({}) }

  const handleSaveRow = async () => {
    if (!newNombre.trim() || !newProyectoId) return
    setSaving(true)
    try {
      const created = await createProducto({ nombre: newNombre, proyecto_id: newProyectoId, descripcion: newDesc || undefined })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateProducto(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load()
    } finally {
      setSaving(false)
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

  const handleEditMetaCell = (row: Producto, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateProducto(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteProducto(id)))
    await load()
  }

  const handleEditColumn = (def: MetaColumnDef) => {
    setEditingColKey(def.key)
    setColName(def.label ?? def.key)
    setColType(def.type)
    setColListOptions(def.options ?? [])
    setColColor(def.color ?? '')
    setShowColForm(true)
  }

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    const validOptions = colListOptions.filter((o) => o.label.trim())
    const color = colType !== 'list' ? colColor || undefined : undefined
    if (editingColKey) {
      updateColumn(editingColKey, colType, validOptions.length ? validOptions : undefined, colName, color)
      setEditingColKey(null)
    } else {
      addColumn(colName, colType, validOptions.length ? validOptions : undefined, color)
    }
    setColName(''); setColType('text'); setColListOptions([]); setColColor(''); setShowColForm(false)
  }

  const closeColForm = () => {
    setShowColForm(false); setEditingColKey(null); setColName(''); setColType('text'); setColListOptions([]); setColColor('')
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.descripcion, i.proyecto?.nombre, ...Object.values(i.meta)].some(
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
      render: (r) => <span className="font-medium text-ink">{r.nombre}</span>,
      className: 'w-56',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Proyecto',
      render: (r) => r.proyecto
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.proyecto.nombre}</span>
        : <span className="text-ink/30 text-[13px]">—</span>,
      getValue: (r) => r.proyecto?.id ?? '',
      onEdit: handleEditProyecto,
      selectOptions: proyectos.map((p) => ({ value: p.id, label: p.nombre })),
    },
    {
      header: 'Descripción',
      render: (r) => <span className="text-ink/70 text-[13px]">{r.descripcion ?? '—'}</span>,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre…" className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newProyectoId}
          onChange={setNewProyectoId}
          options={proyectos.map((p) => ({ value: p.id, label: p.nombre }))}
          placeholder="Proyecto…"
          label="Proyecto"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripción…" className={inputCls} />
      </td>
    </>
  )

  const addRowActions = (
    <>
      <button onClick={handleSaveRow} disabled={saving || !newNombre.trim() || !newProyectoId} className="text-brand-600 hover:text-brand-700 mr-1.5 font-bold text-base disabled:opacity-40" title="Guardar">✓</button>
      <button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">✕</button>
    </>
  )

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <>
      <div className="flex-1 min-h-0 overflow-auto p-8">
        <CatalogGrid
          eyebrow="Catálogo"
          title="Productos"
          addLabel="Nuevo producto"
          entityLabel="productos"
          rows={filtered}
          columns={columns}
          getKey={(r) => r.id}
          onRowClick={(r) => navigate(`/productos/${r.id}`)}
          canWrite={canWrite}
          onAdd={canWrite ? () => setAddingRow(true) : undefined}
          addRowCells={canWrite && addingRow ? addRowCells : undefined}
          addRowActions={canWrite && addingRow ? addRowActions : undefined}
          metaColumnDefs={allMetaCols}
          getMeta={getMeta}
          onAddColumn={canWrite ? () => setShowColForm(true) : undefined}
          onDeleteColumn={canWrite ? deleteColumn : undefined}
          onEditColumn={canWrite ? handleEditColumn : undefined}
          onEditMetaCell={canWrite ? handleEditMetaCell : undefined}
          addRowMetaValues={addRowMeta}
          onAddRowMetaChange={canWrite ? (k, v) => setAddRowMeta((prev) => ({ ...prev, [k]: v })) : undefined}
          onDeleteRows={canWrite ? handleDeleteRows : undefined}
          search={search}
          onSearch={setSearch}
        />
      </div>

      <ColFormModal
        open={showColForm}
        editingKey={editingColKey}
        name={colName}
        type={colType}
        listOptions={colListOptions}
        color={colColor}
        onClose={closeColForm}
        onNameChange={setColName}
        onTypeChange={setColType}
        onListOptionsChange={setColListOptions}
        onColorChange={setColColor}
        onSubmit={handleAddColumn}
      />
    </>
  )
}
