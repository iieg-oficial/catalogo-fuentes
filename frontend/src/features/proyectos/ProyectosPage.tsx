import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import ColFormModal from '@/components/ColFormModal'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns, type ColumnType, type ListOption, type MetaColumnDef } from '@/hooks/useMetaColumns'
import type { Column } from '@/components/DataTable'
import type { Proyecto } from '@/types'
import { getProyectos, createProyecto, updateProyecto, deleteProyecto } from './services/proyectosService'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ProyectosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [showColForm, setShowColForm] = useState(false)
  const [colName, setColName] = useState('')
  const [colType, setColType] = useState<ColumnType>('text')
  const [colListOptions, setColListOptions] = useState<ListOption[]>([])
  const [colColor, setColColor] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})
  const [editingColKey, setEditingColKey] = useState<string | null>(null)

  const { allMetaCols, addColumn, deleteColumn, updateColumn, getMeta } = useMetaColumns(items, 'proyectos')

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      setItems(await getProyectos())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewNombre('')
    setNewDesc('')
    setAddRowMeta({})
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    setSaving(true)
    try {
      const created = await createProyecto({ nombre: newNombre, descripcion: newDesc || undefined })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateProyecto(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleEditPrimaryCell = (row: Proyecto, field: 'nombre' | 'descripcion', value: string) => {
    updateProyecto(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleEditMetaCell = (row: Proyecto, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateProyecto(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteProyecto(id)))
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
    setColName('')
    setColType('text')
    setColListOptions([])
    setColColor('')
    setShowColForm(false)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.descripcion, ...Object.values(i.meta)].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Proyecto>[] = [
    {
      header: 'Nombre',
      render: (r) => <span className="font-medium text-ink">{r.nombre}</span>,
      className: 'w-64',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Descripción',
      render: (r) => <span className="text-ink/70">{r.descripcion ?? '—'}</span>,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input
          autoFocus
          required
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          onKeyDown={kd}
          placeholder="Nombre…"
          className={inputCls}
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={kd}
          placeholder="Descripción…"
          className={inputCls}
        />
      </td>
    </>
  )

  const addRowActions = (
    <>
      <button onClick={handleSaveRow} disabled={saving} className="text-brand-600 hover:text-brand-700 mr-1.5 font-bold text-base" title="Guardar">✓</button>
      <button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">✕</button>
    </>
  )

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  const closeColForm = () => { setShowColForm(false); setEditingColKey(null); setColName(''); setColType('text'); setColListOptions([]); setColColor('') }

  return (
    <>
      <div className="flex-1 min-h-0 overflow-auto p-8">
        <CatalogGrid
          eyebrow="Catálogo"
          title="Proyectos"
          addLabel="Nuevo proyecto"
          entityLabel="proyectos"
          rows={filtered}
          columns={columns}
          getKey={(r) => r.id}
          onRowClick={(r) => navigate(`/proyectos/${r.id}`)}
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
