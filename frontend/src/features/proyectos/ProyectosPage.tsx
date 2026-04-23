import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import DataTable, { type Column } from '@/components/DataTable'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns } from '@/hooks/useMetaColumns'
import type { Proyecto } from '@/types'
import { getProyectos, createProyecto, updateProyecto, deleteProyecto } from './services/proyectosService'

const inputCls = 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

const columns: Column<Proyecto>[] = [
  {
    header: 'Nombre',
    render: (r) => <span className="font-medium text-gray-900">{r.nombre}</span>,
    className: 'w-64',
  },
  {
    header: 'Descripción',
    render: (r) => <span className="text-gray-600">{r.descripcion ?? '—'}</span>,
  },
]

export default function ProyectosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [showColForm, setShowColForm] = useState(false)
  const [colName, setColName] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const { allMetaCols, addColumn, deleteColumn, getMeta } = useMetaColumns(items)

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
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    setSaving(true)
    try {
      await createProyecto({ nombre: newNombre, descripcion: newDesc || undefined })
      setAddingRow(false)
      resetFields()
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRow = async (row: Proyecto) => {
    await deleteProyecto(row.id)
    setItems((prev) => prev.filter((i) => i.id !== row.id))
  }

  const handleEditMetaCell = (row: Proyecto, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateProyecto(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    addColumn(colName)
    setColName('')
    setShowColForm(false)
  }

  const filtered = items.filter((i) =>
    i.nombre.toLowerCase().includes(search.toLowerCase()),
  )

  const addRowCells = (
    <>
      <td className="px-3 py-1.5">
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
      <td className="px-3 py-1.5">
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
      <button
        onClick={handleSaveRow}
        disabled={saving}
        className="text-brand-600 hover:text-brand-700 mr-2 font-bold"
        title="Guardar"
      >
        ✓
      </button>
      <button
        onClick={() => { setAddingRow(false); resetFields() }}
        className="text-gray-400 hover:text-gray-600"
        title="Cancelar"
      >
        ✕
      </button>
    </>
  )

  return (
    <>
      <Topbar title="Proyectos" search={search} onSearch={setSearch} />
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            caption="Proyectos"
            getKey={(r) => r.id}
            onRowClick={(r) => navigate(`/proyectos/${r.id}`)}
            onAdd={canWrite ? () => setAddingRow(true) : undefined}
            addRowCells={canWrite && addingRow ? addRowCells : undefined}
            addRowActions={canWrite && addingRow ? addRowActions : undefined}
            onDeleteRow={canWrite ? handleDeleteRow : undefined}
            metaColumns={allMetaCols}
            getMeta={getMeta}
            onAddColumn={canWrite ? () => setShowColForm(true) : undefined}
            onDeleteColumn={canWrite ? deleteColumn : undefined}
            onEditMetaCell={canWrite ? handleEditMetaCell : undefined}
          />
        )}
      </div>

      <Modal open={showColForm} title="Agregar columna" onClose={() => setShowColForm(false)}>
        <form onSubmit={handleAddColumn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del campo *</label>
            <input
              required
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              placeholder="e.g. proposito"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <p className="mt-1 text-xs text-gray-400">Muestra el metadato con esa clave para cada registro.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowColForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">
              Agregar
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
