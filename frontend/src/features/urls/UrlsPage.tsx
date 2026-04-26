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
import type { Url, Instrumento } from '@/types'
import { getUrls, createUrl, updateUrl, deleteUrl } from './services/urlsService'
import { getInstrumentos } from '@/features/instrumentos/services/instrumentosService'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function UrlsPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Url[]>([])
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
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
  const [newUrl, setNewUrl] = useState('')
  const [newInstrumentoId, setNewInstrumentoId] = useState('')
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const { allMetaCols, addColumn, deleteColumn, updateColumn, getMeta, canModifyCol } = useMetaColumns(items, 'urls')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [urls, instrs] = await Promise.all([getUrls(), getInstrumentos()])
      setItems(urls)
      setInstrumentos(instrs)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewUrl(''); setNewInstrumentoId(''); setAddRowMeta({}) }

  const handleSaveRow = async () => {
    if (!newUrl.trim() || !newInstrumentoId) return
    try {
      const created = await createUrl({ url: newUrl, instrumento_id: newInstrumentoId })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateUrl(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditUrl = (row: Url, value: string) => {
    updateUrl(row.id, { url: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, url: value } : i)))
  }

  const handleEditInstrumento = (row: Url, instrId: string) => {
    const instr = instrumentos.find((i) => i.id === instrId) ?? undefined
    updateUrl(row.id, { instrumento_id: instrId })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, instrumento_id: instrId, instrumento: instr } : i)))
  }

  const handleEditMetaCell = (row: Url, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateUrl(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteUrl(id)))
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
    return !q || [i.url, i.instrumento?.nombre, i.instrumento?.base_de_datos?.nombre, ...Object.values(i.meta)].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Url>[] = [
    {
      header: 'URL',
      render: (r) => (
        <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="font-mono text-[12px] text-brand-600 hover:underline truncate block" style={{ maxWidth: 280 }}>
          {r.url}
        </a>
      ),
      className: 'w-72',
      getValue: (r) => r.url,
      onEdit: handleEditUrl,
    },
    {
      header: 'Instrumento',
      render: (r) => r.instrumento
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.instrumento.nombre}</span>
        : <span className="text-ink/30 text-[13px]">—</span>,
      getValue: (r) => r.instrumento_id ?? '',
      onEdit: handleEditInstrumento,
      selectOptions: instrumentos.map((i) => ({ value: i.id, label: i.nombre })),
    },
    {
      header: 'Base de datos',
      render: (r) => r.instrumento?.base_de_datos
        ? <span className="text-ink/60 text-[13px]">{r.instrumento.base_de_datos.nombre}</span>
        : <span className="text-ink/30 text-[13px]">—</span>,
      getValue: (r) => r.instrumento?.base_de_datos?.nombre ?? '',
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={kd} placeholder="https://…" className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newInstrumentoId}
          onChange={setNewInstrumentoId}
          options={instrumentos.map((i) => ({ value: i.id, label: i.nombre }))}
          placeholder="Instrumento…"
          label="Instrumento"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
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
          title="URLs"
          addLabel="Nueva URL"
          entityLabel="URLs"
          rows={filtered}
          columns={columns}
          getKey={(r) => r.id}
          onRowClick={(r) => navigate(`/urls/${r.id}`)}
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
