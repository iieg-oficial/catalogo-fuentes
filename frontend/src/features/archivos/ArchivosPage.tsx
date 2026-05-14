import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Archivo } from '@/types'
import { getArchivos, createArchivo, updateArchivo, deleteArchivo } from './services/archivosService'
import { nombreIcon, descripcionIcon, distribucionesIcon, fechaIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ArchivosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Archivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newRol, setNewRol] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      setItems(await getArchivos())
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewRol(''); setNewObservaciones('') }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createArchivo({ nombre_archivo: newNombre, rol_archivo: newRol || undefined, observaciones_archivo: newObservaciones || undefined })
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditPrimaryCell = (row: Archivo, field: string, value: string) => {
    updateArchivo(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteArchivo(id)))
    await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre_archivo, i.rol_archivo, i.observaciones_archivo].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const fmtBytes = (b: number | null) => {
    if (b == null) return null
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  }

  const fmtDatetime = (d: string | null | undefined) => {
    if (!d) return null
    try { return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d }
  }

  const columns: Column<Archivo>[] = [
    {
      header: 'Nombre archivo',
      icon: nombreIcon(),
      render: (r) => <span className="font-medium text-ink">{r.nombre_archivo}</span>,
      className: 'w-48',
      getValue: (r) => r.nombre_archivo,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre_archivo', v),
    },
    {
      header: 'Ruta en distribucion',
      icon: descripcionIcon(),
      render: (r) => r.ruta_relativa_en_distribucion
        ? <span className="font-mono text-[12px] text-ink/70 truncate block" style={{ maxWidth: 160 }}>{r.ruta_relativa_en_distribucion}</span>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.ruta_relativa_en_distribucion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'ruta_relativa_en_distribucion', v),
    },
    {
      header: 'Rol',
      icon: descripcionIcon(),
      render: (r) => r.rol_archivo
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-violet-500/10 text-violet-700">{r.rol_archivo}</span>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.rol_archivo ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'rol_archivo', v),
    },
    {
      header: 'Fecha ingesta',
      icon: fechaIcon(),
      render: (r) => <span className="text-ink/70 text-[12px]">{fmtDatetime(r.fecha_ingesta_sistema) ?? '--'}</span>,
      getValue: (r) => r.fecha_ingesta_sistema ?? '',
    },
    {
      header: 'Tamano',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[12px] font-mono">{fmtBytes(r.tamano_bytes) ?? '--'}</span>,
      getValue: (r) => r.tamano_bytes?.toString() ?? '',
    },
    {
      header: 'SHA-256',
      icon: descripcionIcon(),
      render: (r) => r.hash_sha256
        ? <span className="font-mono text-[11px] text-ink/50 truncate block" style={{ maxWidth: 100 }}>{r.hash_sha256.slice(0, 16)}...</span>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.hash_sha256 ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'hash_sha256', v),
    },
    {
      header: 'Archivos relacionados',
      icon: jsonIcon(),
      render: (r) => {
        const keys = Object.keys(r.archivos_relacionados ?? {})
        return keys.length
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">{keys.length}</span>
          : <span className="text-ink/30 text-[13px]">--</span>
      },
      getValue: (r) => JSON.stringify(r.archivos_relacionados ?? {}),
    },
    {
      header: 'Ruta almacenamiento',
      icon: descripcionIcon(),
      render: (r) => r.ruta_almacenamiento
        ? <span className="font-mono text-[12px] text-ink/70 truncate block" style={{ maxWidth: 180 }}>{r.ruta_almacenamiento}</span>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.ruta_almacenamiento ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'ruta_almacenamiento', v),
    },
    {
      header: 'Observaciones',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.observaciones_archivo ?? '--'}</span>,
      getValue: (r) => r.observaciones_archivo ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'observaciones_archivo', v),
    },
    {
      header: 'Distribucion',
      icon: distribucionesIcon(),
      render: (r) => r.distribucion
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.distribucion.descriptor ?? r.distribucion.id.slice(0, 8)}</span>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.distribucion?.descriptor ?? '',
    },
  ]

  const emptyTd = <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre archivo..." className={inputCls} />
      </td>
      {emptyTd}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newRol} onChange={(e) => setNewRol(e.target.value)} onKeyDown={kd} placeholder="Rol..." className={inputCls} />
      </td>
      {emptyTd}{emptyTd}{emptyTd}{emptyTd}{emptyTd}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
      {emptyTd}
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
        onDeleteRows={canWrite ? handleDeleteRows : undefined}
        search={search}
        onSearch={setSearch}
      />
    </div>
  )
}
