import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Proyecto } from '@/types'
import { getProyectos, createProyecto, updateProyecto, deleteProyecto } from './services/proyectosService'
import { TextCell } from '@/components/TextCell'
import { nombreIcon, descripcionIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ProyectosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newMeta, setNewMeta] = useState('')

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
    setNewMeta('')
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createProyecto({ nombre: newNombre, descripcion: newDesc || undefined, meta: newMeta ? JSON.parse(newMeta) : undefined })
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
      header: 'Nombre',
      icon: nombreIcon(),
      render: (r) => <TextCell value={r.nombre} />,
      className: 'w-64',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Descripcion',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.descripcion} />,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
    {
      header: 'Meta',
      icon: jsonIcon(),
      render: (r) => {
        const keys = Object.keys(r.meta ?? {})
        return keys.length
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">{keys.length} {keys.length === 1 ? 'campo' : 'campos'}</span>
          : <span className="text-ink/30 text-[13px]">--</span>
      },
      getValue: (r) => JSON.stringify(r.meta ?? {}),
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
          placeholder="Nombre..."
          className={inputCls}
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={kd}
          placeholder="Descripcion..."
          className={inputCls}
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input
          value={newMeta}
          onChange={(e) => setNewMeta(e.target.value)}
          onKeyDown={kd}
          placeholder="JSON..."
          className={inputCls}
        />
      </td>
    </>
  )

  const addRowActions = (
    <button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">x</button>
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
        onRowClick={(r) => navigate(`/proyectos/${r.id}`)}
        canWrite={canWrite}
        onAdd={canWrite ? () => setAddingRow(true) : undefined}
        addRowCells={canWrite && addingRow ? addRowCells : undefined}
        addRowActions={canWrite && addingRow ? addRowActions : undefined}
        onAddRowSave={canWrite && addingRow ? handleSaveRow : undefined}
        onDeleteRows={canWrite ? handleDeleteRows : undefined}
        search={search}
        onSearch={setSearch}
      />
    </div>
  )
}
