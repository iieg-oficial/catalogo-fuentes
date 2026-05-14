import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Fuente } from '@/types'
import { getFuentes, createFuente, updateFuente, deleteFuente } from '../services/fuentesService'
import { nombreIcon, descripcionIcon, estadoIcon, urlIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function FuentesPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Fuente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      setItems(await getFuentes())
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewDesc('') }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createFuente({ nombre: newNombre, descripcion: newDesc || undefined })
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditPrimaryCell = (row: Fuente, field: 'nombre' | 'descripcion', value: string) => {
    updateFuente(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteFuente(id)))
    await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.nombre_corto, i.sector, i.descripcion].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Fuente>[] = [
    {
      header: 'Nombre',
      icon: nombreIcon(),
      render: (r) => <span className="font-medium text-ink">{r.nombre}</span>,
      className: 'w-48',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Nombre corto',
      icon: nombreIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.nombre_corto ?? '--'}</span>,
      getValue: (r) => r.nombre_corto ?? '',
    },
    {
      header: 'Sector',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.sector ?? '--'}</span>,
      getValue: (r) => r.sector ?? '',
    },
    {
      header: 'Ambito',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.ambito ?? '--'}</span>,
      getValue: (r) => r.ambito ?? '',
    },
    {
      header: 'Oficial',
      icon: estadoIcon(),
      render: (r) => r.es_fuente_oficial
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span>
        : <span className="text-ink/30 text-[13px]">No</span>,
      getValue: (r) => r.es_fuente_oficial ? 'Si' : 'No',
    },
    {
      header: 'Jurisdiccion',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.jurisdiccion ?? '--'}</span>,
      getValue: (r) => r.jurisdiccion ?? '',
    },
    {
      header: 'URL',
      icon: urlIcon(),
      render: (r) => r.url
        ? <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-mono text-[12px] text-brand-600 hover:underline truncate block" style={{ maxWidth: 180 }}>{r.url}</a>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.url ?? '',
    },
    {
      header: 'Descripcion',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.descripcion ?? '--'}</span>,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
    {
      header: 'Publicador',
      icon: estadoIcon(),
      render: (r) => r.es_publicador
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span>
        : <span className="text-ink/30 text-[13px]">No</span>,
      getValue: (r) => r.es_publicador ? 'Si' : 'No',
    },
    {
      header: 'URL terminos uso',
      icon: urlIcon(),
      render: (r) => r.url_terminos_uso
        ? <a href={r.url_terminos_uso} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-mono text-[12px] text-brand-600 hover:underline truncate block" style={{ maxWidth: 180 }}>{r.url_terminos_uso}</a>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.url_terminos_uso ?? '',
    },
    {
      header: 'URL aviso privacidad',
      icon: urlIcon(),
      render: (r) => r.url_aviso_privacidad
        ? <a href={r.url_aviso_privacidad} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-mono text-[12px] text-brand-600 hover:underline truncate block" style={{ maxWidth: 180 }}>{r.url_aviso_privacidad}</a>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.url_aviso_privacidad ?? '',
    },
    {
      header: 'Contacto institucional',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.contacto_institucional ?? '--'}</span>,
      getValue: (r) => r.contacto_institucional ?? '',
    },
  ]

  const emptyTd = <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      {emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      {emptyTd}{emptyTd}{emptyTd}{emptyTd}
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
        title="Fuentes"
        addLabel="Nueva fuente"
        entityLabel="fuentes"
        rows={filtered}
        columns={columns}
        getKey={(r) => r.id}
        onRowClick={(r) => navigate(`/fuentes/${r.id}`)}
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
