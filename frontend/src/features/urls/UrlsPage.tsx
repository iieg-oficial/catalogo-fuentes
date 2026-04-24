import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'
import DataTable, { type Column } from '@/components/DataTable'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import { useMetaColumns } from '@/hooks/useMetaColumns'
import type { Instrumento, Url } from '@/types'
import { getUrls, createUrl, updateUrl, deleteUrl } from './services/urlsService'
import { getInstrumentos } from '@/features/instrumentos/services/instrumentosService'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'
const selectCls = 'px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-700'

const columns: Column<Url>[] = [
  {
    header: 'URL',
    render: (r) => (
      <a
        href={r.url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-brand-600 hover:text-brand-700 hover:underline break-all text-xs font-mono"
      >
        {r.url}
      </a>
    ),
  },
  {
    header: 'Instrumento',
    render: (r) => r.instrumento
      ? <span className="inline-block bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{r.instrumento.nombre}</span>
      : <span className="text-gray-400">—</span>,
    className: 'w-52',
  },
  {
    header: 'Base de datos',
    render: (r) => r.instrumento?.base_de_datos
      ? <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{r.instrumento.base_de_datos.nombre}</span>
      : <span className="text-gray-400">—</span>,
    className: 'w-48',
  },
]

export default function UrlsPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Url[]>([])
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterInstrumentoId, setFilterInstrumentoId] = useState('')
  const [showColForm, setShowColForm] = useState(false)
  const [colName, setColName] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newInstrumentoId, setNewInstrumentoId] = useState('')
  const [saving, setSaving] = useState(false)
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const { allMetaCols, addColumn, deleteColumn, getMeta } = useMetaColumns(items)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [urls, insts] = await Promise.all([getUrls(), getInstrumentos()])
      setItems(urls)
      setInstrumentos(insts)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewUrl('')
    setNewInstrumentoId('')
    setAddRowMeta({})
  }

  const handleSaveRow = async () => {
    if (!newUrl.trim() || !newInstrumentoId) return
    setSaving(true)
    try {
      const created = await createUrl({ url: newUrl, instrumento_id: newInstrumentoId })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateUrl(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRow = async (row: Url) => {
    await deleteUrl(row.id)
    setItems((prev) => prev.filter((i) => i.id !== row.id))
  }

  const handleEditMetaCell = (row: Url, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateUrl(row.id, { meta: nm })
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
    i.url.toLowerCase().includes(search.toLowerCase()) &&
    (!filterInstrumentoId || i.instrumento?.id === filterInstrumentoId),
  )

  const addRowCells = (
    <>
      <td className="px-3 py-1.5">
        <input
          autoFocus
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={kd}
          placeholder="https://…"
          className={inputCls}
        />
      </td>
      <td className="px-3 py-1.5">
        <select
          value={newInstrumentoId}
          onChange={(e) => setNewInstrumentoId(e.target.value)}
          className={inputCls}
        >
          <option value="">Instrumento…</option>
          {instrumentos.map((i) => (
            <option key={i.id} value={i.id}>{i.nombre}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-1.5" />
    </>
  )

  const addRowActions = (
    <>
      <button
        onClick={handleSaveRow}
        disabled={saving || !newUrl.trim() || !newInstrumentoId}
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
        title="URLs"
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
            onRowClick={(r) => navigate(`/urls/${r.id}`)}
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
              placeholder="e.g. estado"
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
