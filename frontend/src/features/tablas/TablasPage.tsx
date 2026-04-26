import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import ColFormModal from '@/components/ColFormModal'
import TagPills from '@/components/TagPills'
import SelectInput from '@/components/SelectInput'
import MultiSelectInput from '@/components/MultiSelectInput'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns, type ColumnType, type ListOption, type MetaColumnDef } from '@/hooks/useMetaColumns'
import type { Column } from '@/components/DataTable'
import type { Tabla, BaseDeDatos, Producto } from '@/types'
import { getTablas, createTabla, updateTabla, deleteTabla } from './services/tablasService'
import { getBasesDeDatos } from '@/features/bases_de_datos/services/basesDeDatosService'
import { getProductos } from '@/features/productos/services/productosService'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function TablasPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Tabla[]>([])
  const [bases, setBases] = useState<BaseDeDatos[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
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
  const [newBdId, setNewBdId] = useState('')
  const [newProductoIds, setNewProductoIds] = useState<string[]>([])
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const { allMetaCols, addColumn, deleteColumn, updateColumn, getMeta, canModifyCol } = useMetaColumns(items, 'tablas')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [tablas, bds, prods] = await Promise.all([getTablas(), getBasesDeDatos(), getProductos()])
      setItems(tablas)
      setBases(bds)
      setProductos(prods)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewBdId(''); setNewProductoIds([]); setAddRowMeta({}) }

  const handleSaveRow = async () => {
    if (!newNombre.trim() || !newBdId) return
    try {
      const created = await createTabla({
        nombre: newNombre,
        base_de_datos_id: newBdId,
        producto_ids: newProductoIds.length ? newProductoIds : undefined,
      })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateTabla(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditNombre = (row: Tabla, value: string) => {
    updateTabla(row.id, { nombre: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, nombre: value } : i)))
  }

  const handleEditBaseDeDatos = (row: Tabla, bdId: string) => {
    const bd = bases.find((b) => b.id === bdId) ?? null
    updateTabla(row.id, { base_de_datos_id: bdId })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, base_de_datos_id: bdId, base_de_datos: bd } : i)))
  }

  const handleEditProductos = (row: Tabla, value: string) => {
    const ids = value.split(',').filter(Boolean)
    const linked = productos.filter((p) => ids.includes(p.id))
    updateTabla(row.id, { producto_ids: ids })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, productos: linked } : i)))
  }

  const handleEditMetaCell = (row: Tabla, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateTabla(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteTabla(id)))
    await load(true)
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
    return !q || [i.nombre, i.base_de_datos?.nombre, ...i.productos.map((p) => p.nombre), ...Object.values(i.meta)].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Tabla>[] = [
    {
      header: 'Nombre',
      render: (r) => <span className="font-medium text-ink">{r.nombre}</span>,
      className: 'w-56',
      getValue: (r) => r.nombre,
      onEdit: handleEditNombre,
    },
    {
      header: 'Base de datos',
      render: (r) => r.base_de_datos
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.base_de_datos.nombre}</span>
        : <span className="text-ink/30 text-[13px]">—</span>,
      getValue: (r) => r.base_de_datos_id ?? '',
      onEdit: handleEditBaseDeDatos,
      selectOptions: bases.map((b) => ({ value: b.id, label: b.nombre })),
    },
    {
      header: 'Productos',
      render: (r) => <TagPills items={r.productos.map((p) => p.nombre)} label="PRODUCTOS" />,
      getValue: (r) => r.productos.map((p) => p.id).join(','),
      onEdit: handleEditProductos,
      selectOptions: productos.map((p) => ({ value: p.id, label: p.nombre })),
      multiple: true,
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre…" className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newBdId}
          onChange={setNewBdId}
          options={bases.map((b) => ({ value: b.id, label: b.nombre }))}
          placeholder="Base de datos…"
          label="Base de datos"
        />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <MultiSelectInput
          value={newProductoIds}
          onChange={setNewProductoIds}
          options={productos.map((p) => ({ value: p.id, label: p.nombre }))}
          placeholder="Productos…"
          label="Productos"
        />
      </td>
    </>
  )

  const addRowActions = (
    <button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">✕</button>
  )

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <>
      <div className="flex-1 min-h-0 overflow-auto p-8">
        <CatalogGrid
          eyebrow="Catálogo"
          title="Tablas"
          addLabel="Nueva tabla"
          entityLabel="tablas"
          rows={filtered}
          columns={columns}
          getKey={(r) => r.id}
          onRowClick={(r) => navigate(`/tablas/${r.id}`)}
          canWrite={canWrite}
          onAdd={canWrite ? () => setAddingRow(true) : undefined}
          addRowCells={canWrite && addingRow ? addRowCells : undefined}
          addRowActions={canWrite && addingRow ? addRowActions : undefined}
          onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined}
          metaColumnDefs={allMetaCols}
          getMeta={getMeta}
          onAddColumn={canWrite ? () => setShowColForm(true) : undefined}
          onDeleteColumn={canWrite ? deleteColumn : undefined}
          onEditColumn={canWrite ? handleEditColumn : undefined}
          canModifyColumn={canWrite ? canModifyCol : undefined}
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
