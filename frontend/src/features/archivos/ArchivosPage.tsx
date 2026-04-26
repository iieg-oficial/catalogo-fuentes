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
import type { Archivo, Url } from '@/types'
import { getArchivos, createArchivo, updateArchivo, deleteArchivo } from './services/archivosService'
import { getUrls } from '@/features/urls/services/urlsService'
import { urlsIcon, descripcionIcon, fechaIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ArchivosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Archivo[]>([])
  const [urls, setUrls] = useState<Url[]>([])
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
  const [newUrlId, setNewUrlId] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFechaFuente, setNewFechaFuente] = useState('')
  const [newFechaPub, setNewFechaPub] = useState('')
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const { allMetaCols, addColumn, deleteColumn, updateColumn, getMeta, canModifyCol } = useMetaColumns(items, 'archivos')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [archivos, urlList] = await Promise.all([getArchivos(), getUrls()])
      setItems(archivos)
      setUrls(urlList)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewUrlId(''); setNewDesc(''); setNewFechaFuente(''); setNewFechaPub(''); setAddRowMeta({}) }

  const handleSaveRow = async () => {
    if (!newUrlId) return
    try {
      const created = await createArchivo({
        url_id: newUrlId,
        descripcion: newDesc || undefined,
        fecha_fuente: newFechaFuente || undefined,
        fecha_publicacion: newFechaPub || undefined,
      })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateArchivo(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditPrimaryCell = (row: Archivo, field: 'descripcion' | 'fecha_fuente' | 'fecha_publicacion', value: string) => {
    updateArchivo(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleEditMetaCell = (row: Archivo, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateArchivo(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteArchivo(id)))
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
    return !q || [i.descripcion, i.fecha_fuente, i.fecha_publicacion, i.url_ref?.url, ...Object.values(i.meta)].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return d }
  }

  const columns: Column<Archivo>[] = [
    {
      header: 'URL',
      icon: urlsIcon(),
      render: (r) => r.url_ref?.url
        ? (
          <a href={r.url_ref.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="font-mono text-[12px] text-brand-600 hover:underline truncate block" style={{ maxWidth: 220 }}>
            {r.url_ref.url}
          </a>
        )
        : <span className="text-ink/30 text-[13px]">—</span>,
      getValue: (r) => r.url_ref?.url ?? '',
    },
    {
      header: 'Descripción',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.descripcion ?? '—'}</span>,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
    {
      header: 'Fecha fuente',
      icon: fechaIcon(),
      render: (r) => {
        const fmt = fmtDate(r.fecha_fuente)
        return <span className="text-ink/70 text-[12px]">{fmt ?? '—'}</span>
      },
      getValue: (r) => r.fecha_fuente ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'fecha_fuente', v),
    },
    {
      header: 'Fecha publicación',
      icon: fechaIcon(),
      render: (r) => {
        const fmt = fmtDate(r.fecha_publicacion)
        return <span className="text-ink/70 text-[12px]">{fmt ?? '—'}</span>
      },
      getValue: (r) => r.fecha_publicacion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'fecha_publicacion', v),
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newUrlId}
          onChange={setNewUrlId}
          options={urls.map((u) => ({ value: u.id, label: u.url.length > 60 ? u.url.slice(0, 60) + '…' : u.url }))}
          placeholder="URL…"
          label="URL"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripción…" className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="date" value={newFechaFuente} onChange={(e) => setNewFechaFuente(e.target.value)} className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="date" value={newFechaPub} onChange={(e) => setNewFechaPub(e.target.value)} className={inputCls} />
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
          title="Archivos"
          addLabel="Nuevo archivo"
          entityLabel="archivos"
          rows={filtered}
          columns={columns}
          getKey={(r) => r.id}
          onRowClick={(r) => navigate(`/archivos/${r.id}`)}
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
