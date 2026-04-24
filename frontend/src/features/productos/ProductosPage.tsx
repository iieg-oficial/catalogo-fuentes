import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import DataTable, { type Column } from '@/components/DataTable'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns, type ColumnType, type ListOption, type MetaColumnDef, LIST_COLOR_PALETTE } from '@/hooks/useMetaColumns'
import type { Producto, Proyecto } from '@/types'
import { getProductos, createProducto, updateProducto, deleteProducto } from './services/productosService'
import { getProyectos } from '@/features/proyectos/services/proyectosService'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'
const selectCls = 'px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-700'
const modalInputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

export default function ProductosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Producto[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterProyectoId, setFilterProyectoId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showColForm, setShowColForm] = useState(false)
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

  const [editingColKey, setEditingColKey] = useState<string | null>(null)
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

  const resetFields = () => {
    setNewNombre('')
    setNewProyectoId('')
    setNewDesc('')
    setAddRowMeta({})
  }

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

  const handleDeleteRow = async (row: Producto) => {
    await deleteProducto(row.id)
    setItems((prev) => prev.filter((i) => i.id !== row.id))
  }

  const handleEditPrimaryCell = (row: Producto, field: 'nombre' | 'descripcion', value: string) => {
    updateProducto(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleEditMetaCell = (row: Producto, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateProducto(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const columns: Column<Producto>[] = [
    {
      header: 'Nombre',
      render: (r) => <span className="font-medium text-gray-900">{r.nombre}</span>,
      className: 'w-56',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Proyecto',
      render: (r) => (
        <span className="inline-block bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium">
          {r.proyecto.nombre}
        </span>
      ),
      className: 'w-48',
    },
    {
      header: 'Descripción',
      render: (r) => <span className="text-gray-600">{r.descripcion ?? '—'}</span>,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
  ]

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
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

  const filtered = items.filter((i) =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) &&
    (!filterProyectoId || i.proyecto.id === filterProyectoId),
  )

  const addRowCells = (
    <>
      <td className="px-3 py-1.5">
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre…" className={inputCls} />
      </td>
      <td className="px-3 py-1.5">
        <select value={newProyectoId} onChange={(e) => setNewProyectoId(e.target.value)} className={inputCls}>
          <option value="">Proyecto…</option>
          {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </td>
      <td className="px-3 py-1.5">
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripción…" className={inputCls} />
      </td>
    </>
  )

  const addRowActions = (
    <>
      <button onClick={handleSaveRow} disabled={saving || !newNombre.trim() || !newProyectoId} className="text-brand-600 hover:text-brand-700 mr-2 font-bold disabled:opacity-40 disabled:cursor-not-allowed" title="Guardar">✓</button>
      <button onClick={() => { setAddingRow(false); resetFields() }} className="text-gray-400 hover:text-gray-600" title="Cancelar">✕</button>
    </>
  )

  const editBtn = canWrite ? (
    <button
      onClick={() => setIsEditing((v) => !v)}
      className={isEditing
        ? 'px-3 py-1.5 text-xs font-medium rounded-md bg-brand-600 text-white'
        : 'px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 transition-colors duration-150'}
    >
      {isEditing ? 'Listo' : 'Editar'}
    </button>
  ) : undefined

  return (
    <>
      <Topbar
        title="Productos"
        search={search}
        onSearch={setSearch}
        filters={
          <select value={filterProyectoId} onChange={(e) => setFilterProyectoId(e.target.value)} className={selectCls}>
            <option value="">Todos los proyectos</option>
            {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        }
        actions={editBtn}
      />
      <div className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : (
          <DataTable
            className="flex-1 min-h-0"
            columns={columns}
            rows={filtered}
            getKey={(r) => r.id}
            isEditing={isEditing}
            onRowClick={(r) => navigate(`/productos/${r.id}`)}
            onAdd={canWrite ? () => setAddingRow(true) : undefined}
            addRowCells={canWrite && addingRow ? addRowCells : undefined}
            addRowActions={canWrite && addingRow ? addRowActions : undefined}
            onDeleteRow={canWrite ? handleDeleteRow : undefined}
            metaColumnDefs={allMetaCols}
            getMeta={getMeta}
            onAddColumn={canWrite ? () => setShowColForm(true) : undefined}
            onDeleteColumn={canWrite ? deleteColumn : undefined}
            onEditColumn={canWrite ? handleEditColumn : undefined}
            onEditMetaCell={canWrite ? handleEditMetaCell : undefined}
            addRowMetaValues={addRowMeta}
            onAddRowMetaChange={canWrite ? (k, v) => setAddRowMeta((prev) => ({ ...prev, [k]: v })) : undefined}
          />
        )}
      </div>

      <Modal open={showColForm} title={editingColKey ? 'Editar columna' : 'Nueva columna'} onClose={() => { setShowColForm(false); setEditingColKey(null); setColName(''); setColType('text'); setColListOptions([]); setColColor('') }}>
        <form onSubmit={handleAddColumn}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
              <input required value={colName} onChange={(e) => setColName(e.target.value)} placeholder="ej. plataforma" className={modalInputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo</label>
              <select value={colType} onChange={(e) => setColType(e.target.value as ColumnType)} className={`${modalInputCls} bg-white`}>
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="url">URL</option>
                <option value="date">Fecha</option>
                <option value="boolean">Booleano</option>
                <option value="list">Lista</option>
              </select>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3">
            <div className={`flex items-center gap-3 ${colType === 'list' ? 'opacity-40' : ''}`}>
              <button
                type="button"
                role="switch"
                aria-checked={!!colColor && colType !== 'list'}
                onClick={() => { if (!colColor) setColColor(LIST_COLOR_PALETTE[0]); else setColColor('') }}
                disabled={colType === 'list'}
                className={`relative w-8 h-4 rounded-full transition-colors duration-150 shrink-0 ${colColor && colType !== 'list' ? 'bg-brand-600' : 'bg-neutral-200'} ${colType !== 'list' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-150 ${colColor && colType !== 'list' ? 'translate-x-4' : ''}`} />
              </button>
              <span className="text-sm font-medium text-neutral-700">Color</span>
              {colColor && colType !== 'list' && (
                <div className="flex items-center gap-1.5">
                  {LIST_COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColColor(c)}
                      title={c}
                      className={`w-4 h-4 rounded-full transition-all duration-100 ${
                        colColor === c ? 'ring-2 ring-offset-1 ring-neutral-400 scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
              {colType === 'list' && <span className="text-xs text-neutral-300">Las listas usan colores por opción</span>}
            </div>
            {colType === 'list' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Opciones</label>
                <div className="space-y-1.5">
                  {colListOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <label className="shrink-0 cursor-pointer" title="Cambiar color">
                        <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: opt.color ?? '#94a3b8' }} />
                        <input
                          type="color"
                          value={opt.color ?? '#94a3b8'}
                          onChange={(e) => setColListOptions((prev) => prev.map((o, i) => i === idx ? { ...o, color: e.target.value } : o))}
                          className="sr-only"
                        />
                      </label>
                      <input
                        value={opt.label}
                        onChange={(e) => setColListOptions((prev) => prev.map((o, i) => i === idx ? { ...o, label: e.target.value } : o))}
                        placeholder="Opción…"
                        className="flex-1 px-2.5 py-1 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setColListOptions((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-neutral-300 hover:text-red-400 transition-colors text-lg leading-none"
                        aria-label="Quitar opción"
                      >×</button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setColListOptions((prev) => [...prev, { label: '', color: LIST_COLOR_PALETTE[prev.length % LIST_COLOR_PALETTE.length] }])}
                  className="mt-2 flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 1v8M1 5h8"/></svg>
                  Agregar opción
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end gap-2">
            <button type="button" onClick={() => { setShowColForm(false); setEditingColKey(null); setColName(''); setColType('text'); setColListOptions([]); setColColor('') }} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">Crear</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
