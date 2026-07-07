import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import ImportCsvButton from '@/components/ImportCsvButton'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Proyecto } from '@/types'
import { getProyectos, createProyecto, updateProyecto, deleteProyecto } from '../services/proyectosService'
import { TextCell } from '@/components/TextCell'
import JsonEditorInput from '@/components/JsonEditorInput'
import { JsonCell } from '@/components/JsonCell'
import { nombreIcon, descripcionIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ProyectosPage() {
  const { canWrite, canManageUsers } = useAuthContext()
  const [items, setItems] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newMeta, setNewMeta] = useState<Record<string, unknown>>({})

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      setItems(await getProyectos())
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewNombre('')
    setNewDesc('')
    setNewMeta({})
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createProyecto({ nombre: newNombre, descripcion: newDesc || undefined, meta: Object.keys(newMeta).length ? newMeta : undefined })
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditPrimaryCell = (row: Proyecto, field: 'nombre' | 'descripcion', value: string) => {
    updateProyecto(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteProyecto(id)))
    await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.descripcion].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Proyecto>[] = [
    {
      header: 'Descripción',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.descripcion} />,
      className: 'w-64',
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
    {
      header: 'Nombre',
      icon: nombreIcon(),
      render: (r) => <TextCell value={r.nombre} />,
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Metadata',
      icon: jsonIcon(),
      render: (r) => <JsonCell value={r.meta} />,
      getValue: (r) => JSON.stringify(r.meta ?? {}),
      onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateProyecto(r.id, { meta: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, meta: parsed } : i))) } catch {} },
      inputType: 'json',
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input
          autoFocus
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={kd}
          placeholder="Descripcion..."
          className={inputCls}
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input
          required
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          onKeyDown={kd}
          placeholder="Nombre..."
          className={inputCls}
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newMeta} onChange={setNewMeta} label="Meta" />
      </td>
    </>
  )

  const addRowActions = (
    <button onClick={() => { setAddingRow(false); resetFields() }} className="w-7 h-7 flex items-center justify-center rounded text-ink/60 hover:text-ink/80 hover:bg-ink/[5%]" aria-label="Cancelar"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l8 8M9 1L1 9"/></svg></button>
  )

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid
        eyebrow="Catalogo"
        title="Proyectos"
        addLabel="Nuevo proyecto"
        entityLabel="proyectos"
        rows={filtered}
        columns={columns}
        getKey={(r) => r.id}
        canWrite={canWrite}
        onAdd={canWrite ? () => setAddingRow(true) : undefined}
        addRowCells={canWrite && addingRow ? addRowCells : undefined}
        addRowActions={canWrite && addingRow ? addRowActions : undefined}
        onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined}
        onDeleteRows={canWrite ? handleDeleteRows : undefined}
        search={search}
        onSearch={setSearch}
        importSlot={canManageUsers ? <ImportCsvButton entidad="proyecto" onDone={() => load(true)} /> : undefined}
      />
    </div>
  )
}
