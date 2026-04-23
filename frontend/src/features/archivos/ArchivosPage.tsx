import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import DataTable, { type Column } from '@/components/DataTable'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns } from '@/hooks/useMetaColumns'
import type { Archivo, Url } from '@/types'
import { getArchivos, createArchivo, updateArchivo, deleteArchivo } from './services/archivosService'
import { getUrls } from '@/features/urls/services/urlsService'

const inputCls = 'w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'
const selectCls = 'px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-700'

const columns: Column<Archivo>[] = [
  {
    header: 'Descripción',
    render: (r) => <span className="font-medium text-gray-900">{r.descripcion ?? '—'}</span>,
    className: 'w-56',
  },
  {
    header: 'Fecha fuente',
    render: (r) => <span className="text-gray-600 text-xs">{r.fecha_fuente ?? '—'}</span>,
    className: 'w-32',
  },
  {
    header: 'Publicación',
    render: (r) => <span className="text-gray-600 text-xs">{r.fecha_publicacion ?? '—'}</span>,
    className: 'w-32',
  },
  {
    header: 'URL',
    render: (r) => r.url_ref
      ? (
        <a
          href={r.url_ref.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-brand-600 hover:text-brand-700 hover:underline text-xs font-mono break-all"
        >
          {r.url_ref.url.length > 50 ? r.url_ref.url.slice(0, 50) + '…' : r.url_ref.url}
        </a>
      )
      : <span className="text-gray-400">—</span>,
  },
  {
    header: 'Instrumento',
    render: (r) => r.url_ref?.instrumento
      ? <span className="inline-block bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{r.url_ref.instrumento.nombre}</span>
      : <span className="text-gray-400">—</span>,
    className: 'w-48',
  },
  {
    header: 'Base de datos',
    render: (r) => r.url_ref?.instrumento?.base_de_datos
      ? <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{r.url_ref.instrumento.base_de_datos.nombre}</span>
      : <span className="text-gray-400">—</span>,
    className: 'w-48',
  },
]

export default function ArchivosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Archivo[]>([])
  const [urls, setUrls] = useState<Url[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterInstrumentoId, setFilterInstrumentoId] = useState('')
  const [showColForm, setShowColForm] = useState(false)
  const [colName, setColName] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newFuenteFecha, setNewFuenteFecha] = useState('')
  const [newPubFecha, setNewPubFecha] = useState('')
  const [newUrlId, setNewUrlId] = useState('')
  const [saving, setSaving] = useState(false)
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const { allMetaCols, addColumn, deleteColumn, getMeta } = useMetaColumns(items)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [archs, us] = await Promise.all([getArchivos(), getUrls()])
      setItems(archs)
      setUrls(us)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewDesc('')
    setNewFuenteFecha('')
    setNewPubFecha('')
    setNewUrlId('')
    setAddRowMeta({})
  }

  const handleSaveRow = async () => {
    if (!newUrlId) return
    setSaving(true)
    try {
      const created = await createArchivo({
        url_id: newUrlId,
        descripcion: newDesc || undefined,
        fecha_fuente: newFuenteFecha || undefined,
        fecha_publicacion: newPubFecha || undefined,
      })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateArchivo(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRow = async (row: Archivo) => {
    await deleteArchivo(row.id)
    setItems((prev) => prev.filter((i) => i.id !== row.id))
  }

  const handleEditMetaCell = (row: Archivo, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateArchivo(row.id, { meta: nm })
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

  const instrumentos = [
    ...new Map(
      items
        .map((i) => i.url_ref?.instrumento)
        .filter(Boolean)
        .map((inst) => [inst!.id, inst!]),
    ).values(),
  ]

  const filtered = items.filter((i) =>
    (i.descripcion ?? '').toLowerCase().includes(search.toLowerCase()) &&
    (!filterInstrumentoId || i.url_ref?.instrumento?.id === filterInstrumentoId),
  )

  const addRowCells = (
    <>
      <td className="px-3 py-1.5">
        <input
          autoFocus
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={kd}
          placeholder="Descripción…"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          value={newFuenteFecha}
          onChange={(e) => setNewFuenteFecha(e.target.value)}
          onKeyDown={kd}
          placeholder="INEGI 2023…"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <input
          type="date"
          value={newPubFecha}
          onChange={(e) => setNewPubFecha(e.target.value)}
          onKeyDown={kd}
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <select
          value={newUrlId}
          onChange={(e) => setNewUrlId(e.target.value)}
          className={inputCls}
        >
          <option value="">URL…</option>
          {urls.map((u) => (
            <option key={u.id} value={u.id}>
              {u.url.length > 50 ? u.url.slice(0, 50) + '…' : u.url}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-1.5" />
      <td className="px-3 py-1.5" />
    </>
  )

  const addRowActions = (
    <>
      <button
        onClick={handleSaveRow}
        disabled={saving || !newUrlId}
        className="text-brand-600 hover:text-brand-700 mr-2 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
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
      <Topbar
        title="Archivos"
        search={search}
        onSearch={setSearch}
        filters={
          <select value={filterInstrumentoId} onChange={(e) => setFilterInstrumentoId(e.target.value)} className={selectCls}>
            <option value="">Todos los instrumentos</option>
            {instrumentos.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </select>
        }
      />
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            getKey={(r) => r.id}
            onRowClick={(r) => navigate(`/archivos/${r.id}`)}
            onAdd={canWrite ? () => setAddingRow(true) : undefined}
            addRowCells={canWrite && addingRow ? addRowCells : undefined}
            addRowActions={canWrite && addingRow ? addRowActions : undefined}
            onDeleteRow={canWrite ? handleDeleteRow : undefined}
            metaColumns={allMetaCols}
            getMeta={getMeta}
            onAddColumn={canWrite ? () => setShowColForm(true) : undefined}
            onDeleteColumn={canWrite ? deleteColumn : undefined}
            onEditMetaCell={canWrite ? handleEditMetaCell : undefined}
            addRowMetaValues={addRowMeta}
            onAddRowMetaChange={canWrite ? (k, v) => setAddRowMeta((prev) => ({ ...prev, [k]: v })) : undefined}
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
              placeholder="e.g. formato"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
            <p className="mt-1 text-xs text-gray-400">Muestra el metadato con esa clave para cada registro.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowColForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">Agregar</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
