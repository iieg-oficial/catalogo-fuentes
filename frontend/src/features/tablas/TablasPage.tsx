import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import DataTable, { type Column } from '@/components/DataTable'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns, type ColumnType, type ListOption, type MetaColumnDef, LIST_COLOR_PALETTE } from '@/hooks/useMetaColumns'
import type { BaseDeDatos, Producto, Tabla } from '@/types'
import { getTablas, createTabla, updateTabla, deleteTabla } from './services/tablasService'
import { getBasesDeDatos } from '@/features/bases_de_datos/services/basesDeDatosService'
import { getProductos } from '@/features/productos/services/productosService'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'
const selectCls = 'px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-700'
const modalInputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

export default function TablasPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Tabla[]>([])
  const [bases, setBases] = useState<BaseDeDatos[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterBdId, setFilterBdId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showColForm, setShowColForm] = useState(false)
  const [colName, setColName] = useState('')
  const [colType, setColType] = useState<ColumnType>('text')
  const [colListOptions, setColListOptions] = useState<ListOption[]>([])
  const [colColor, setColColor] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newBdId, setNewBdId] = useState('')
  const [saving, setSaving] = useState(false)
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const [editingColKey, setEditingColKey] = useState<string | null>(null)
  const { allMetaCols, addColumn, deleteColumn, updateColumn, getMeta } = useMetaColumns(items, 'tablas')

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [tablas, bds, prods] = await Promise.all([getTablas(), getBasesDeDatos(), getProductos()])
      setItems(tablas)
      setBases(bds)
      setProductos(prods)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewNombre('')
    setNewBdId('')
    setAddRowMeta({})
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim() || !newBdId) return
    setSaving(true)
    try {
      const created = await createTabla({ nombre: newNombre, base_de_datos_id: newBdId })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateTabla(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRow = async (row: Tabla) => {
    await deleteTabla(row.id)
    setItems((prev) => prev.filter((i) => i.id !== row.id))
  }

  const handleEditPrimaryCell = (row: Tabla, field: 'nombre', value: string) => {
    updateTabla(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleEditMetaCell = (row: Tabla, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateTabla(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const handleEditProductos = (row: Tabla, value: string) => {
    const productoIds = value.split(',').filter(Boolean)
    updateTabla(row.id, { producto_ids: productoIds })
    const next = productoIds.map((id) => productos.find((p) => p.id === id)!).filter(Boolean)
    setItems((prev) => prev.map((t) => t.id === row.id ? { ...t, productos: next } : t))
  }

  const handleEditBaseDeDatos = (row: Tabla, bdId: string) => {
    const base_de_datos = bases.find((b) => b.id === bdId)
    if (!base_de_datos) return
    updateTabla(row.id, { base_de_datos_id: bdId })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, base_de_datos } : i)))
  }

  const columns: Column<Tabla>[] = [
    {
      header: 'Nombre',
      render: (r) => <span className="font-medium text-gray-900">{r.nombre}</span>,
      className: 'w-56',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Base de datos',
      render: (r) => r.base_de_datos
        ? <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{r.base_de_datos.nombre}</span>
        : <span className="text-neutral-400">—</span>,
      className: 'w-48',
      getValue: (r) => r.base_de_datos?.id ?? '',
      onEdit: handleEditBaseDeDatos,
      selectOptions: bases.map((b) => ({ value: b.id, label: b.nombre })),
    },
    {
      header: 'Productos',
      render: (r) => {
        const visible = r.productos.slice(0, 2)
        const overflow = r.productos.length - 2
        return (
          <div className="flex flex-nowrap gap-1 items-center">
            {r.productos.length === 0 && <span className="text-neutral-400">—</span>}
            {visible.map((p) => (
              <span key={p.id} className="inline-block bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                {p.nombre}
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-xs text-neutral-400 px-1 whitespace-nowrap">+{overflow}</span>
            )}
          </div>
        )
      },
      getValue: (r) => r.productos.map((p) => p.id).join(','),
      onEdit: handleEditProductos,
      selectOptions: productos.map((p) => ({
        value: p.id,
        label: p.nombre,
        group: p.proyecto?.nombre,
      })),
      multiple: true,
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

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    const matches = !q || [i.nombre, i.base_de_datos?.nombre, ...Object.values(i.meta)].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
    return matches && (!filterBdId || i.base_de_datos?.id === filterBdId)
  })

  const addRowCells = (
    <>
      <td className="px-3 py-1.5">
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre…" className={inputCls} />
      </td>
      <td className="px-3 py-1.5">
        <select value={newBdId} onChange={(e) => setNewBdId(e.target.value)} className={inputCls}>
          <option value="">Base de datos…</option>
          {bases.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
      </td>
      <td className="px-3 py-1.5" />
    </>
  )

  const addRowActions = (
    <>
      <button onClick={handleSaveRow} disabled={saving || !newNombre.trim() || !newBdId} className="text-brand-600 hover:text-brand-700 mr-2 font-bold disabled:opacity-40 disabled:cursor-not-allowed" title="Guardar">✓</button>
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
        title="Tablas"
        search={search}
        onSearch={setSearch}
        filters={
          <select value={filterBdId} onChange={(e) => setFilterBdId(e.target.value)} className={selectCls}>
            <option value="">Todas las bases</option>
            {bases.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
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
            onRowClick={(r) => navigate(`/tablas/${r.id}`)}
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
              <input required value={colName} onChange={(e) => setColName(e.target.value)} placeholder="ej. esquema" className={modalInputCls} />
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
