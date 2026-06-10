import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Archivo, Distribucion } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getArchivos, createArchivo, updateArchivo, deleteArchivo } from './services/archivosService'
import { getDistribuciones } from '@/features/distribuciones/services/distribucionesService'
import DatePickerInput from '@/components/DatePickerInput'
import JsonEditorInput from '@/components/JsonEditorInput'
import { JsonCell } from '@/components/JsonCell'
import { nombreIcon, descripcionIcon, distribucionesIcon, fechaIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ArchivosPage() {
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Archivo[]>([])
  const [distribuciones, setDistribuciones] = useState<Distribucion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newRutaRelativa, setNewRutaRelativa] = useState('')
  const [newRol, setNewRol] = useState('')
  const [newRutaAlmacenamiento, setNewRutaAlmacenamiento] = useState('')
  const [newObservaciones, setNewObservaciones] = useState('')
  const [newFechaIngesta, setNewFechaIngesta] = useState('')
  const [newTamano, setNewTamano] = useState('')
  const [newHashSha256, setNewHashSha256] = useState('')
  const [newArchivosRelacionados, setNewArchivosRelacionados] = useState<Record<string, unknown>>({})
  const [newDistribucionId, setNewDistribucionId] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [arch, dist] = await Promise.all([getArchivos(), getDistribuciones()])
      setItems(arch)
      setDistribuciones(dist)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => {
    setNewNombre(''); setNewRutaRelativa(''); setNewRol('')
    setNewRutaAlmacenamiento(''); setNewObservaciones('')
    setNewFechaIngesta(''); setNewTamano(''); setNewHashSha256(''); setNewArchivosRelacionados({})
    setNewDistribucionId('')
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createArchivo({
        nombre_archivo: newNombre,
        ruta_relativa_en_distribucion: newRutaRelativa || undefined,
        rol_archivo: newRol || undefined,
        fecha_ingesta_sistema: newFechaIngesta || undefined,
        tamano_bytes: newTamano ? Number(newTamano) : undefined,
        hash_sha256: newHashSha256 || undefined,
        archivos_relacionados: Object.keys(newArchivosRelacionados).length ? newArchivosRelacionados : undefined,
        ruta_almacenamiento: newRutaAlmacenamiento || undefined,
        observaciones_archivo: newObservaciones || undefined,
        distribucion_id: newDistribucionId || undefined,
      })
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

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) } catch { return d }
  }

  const distribucionOpts = distribuciones.map((d) => ({ value: d.id, label: d.descriptor ?? d.id.slice(0, 8) }))

  const columns: Column<Archivo>[] = [
    {
      header: 'archivo',
      icon: nombreIcon(),
      render: (r) => <TextCell value={r.nombre_archivo} />,
      className: 'w-48',
      getValue: (r) => r.nombre_archivo,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre_archivo', v),
    },
    {
      header: 'Ruta en distribución',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.ruta_relativa_en_distribucion} mono />,
      getValue: (r) => r.ruta_relativa_en_distribucion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'ruta_relativa_en_distribucion', v),
    },
    {
      header: 'Rol',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.rol_archivo} />,
      getValue: (r) => r.rol_archivo ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'rol_archivo', v),
    },
    {
      header: 'Hash SHA-256',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.hash_sha256} mono />,
      getValue: (r) => r.hash_sha256 ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'hash_sha256', v),
    },
    {
      header: 'Fecha ingesta',
      icon: fechaIcon(),
      render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_ingesta_sistema) ?? '--'}</span>,
      getValue: (r) => r.fecha_ingesta_sistema ? r.fecha_ingesta_sistema.slice(0, 10) : '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'fecha_ingesta_sistema', v),
      inputType: 'date',
    },
    {
      header: 'Tamaño',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[12px] font-mono">{fmtBytes(r.tamano_bytes) ?? '--'}</span>,
      getValue: (r) => r.tamano_bytes?.toString() ?? '',
      onEdit: (r, v) => { const n = Number(v); if (!isNaN(n)) { updateArchivo(r.id, { tamano_bytes: n }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, tamano_bytes: n } : i))) } },
    },
    {
      header: 'Archivos relacionados',
      icon: jsonIcon(),
      render: (r) => <JsonCell value={r.archivos_relacionados} />,
      getValue: (r) => JSON.stringify(r.archivos_relacionados ?? {}),
      onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateArchivo(r.id, { archivos_relacionados: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, archivos_relacionados: parsed } : i))) } catch {} },
      inputType: 'json',
    },
    {
      header: 'Ruta almacenamiento',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.ruta_almacenamiento} mono />,
      getValue: (r) => r.ruta_almacenamiento ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'ruta_almacenamiento', v),
    },
    {
      header: 'Observaciones',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.observaciones_archivo} />,
      getValue: (r) => r.observaciones_archivo ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'observaciones_archivo', v),
    },
    {
      header: 'Distribución',
      icon: distribucionesIcon(),
      selectOptions: distribucionOpts,
      onEdit: (r, v) => {
        updateArchivo(r.id, { distribucion_id: v })
        const dist = distribuciones.find((d) => d.id === v)
        setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, distribucion_id: v || null, distribucion: dist ? { id: dist.id, descriptor: dist.descriptor } : null } : i)))
      },
      getValue: (r) => r.distribucion_id ?? '',
      render: (r) => <TextCell value={r.distribucion ? (r.distribucion.descriptor ?? r.distribucion.id.slice(0, 8)) : null} />,
    },
  ]

  const addRowCells = (
    <>
      {/* 1. Nombre archivo */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre archivo..." className={inputCls} />
      </td>
      {/* 2. Ruta en distribucion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newRutaRelativa} onChange={(e) => setNewRutaRelativa(e.target.value)} onKeyDown={kd} placeholder="Ruta relativa..." className={inputCls} />
      </td>
      {/* 3. Rol */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newRol} onChange={(e) => setNewRol(e.target.value)} onKeyDown={kd} placeholder="Rol..." className={inputCls} />
      </td>
      {/* 4. Hash SHA-256 */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newHashSha256} onChange={(e) => setNewHashSha256(e.target.value)} onKeyDown={kd} placeholder="Hash SHA-256..." className={inputCls} />
      </td>
      {/* 5. Fecha ingesta */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newFechaIngesta} onChange={setNewFechaIngesta} placeholder="Fecha ingesta..." onKeyDown={kd} />
      </td>
      {/* 5. Tamano (bytes) */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="number" value={newTamano} onChange={(e) => setNewTamano(e.target.value)} onKeyDown={kd} placeholder="Bytes..." className={inputCls} />
      </td>
      {/* 6. Archivos relacionados */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newArchivosRelacionados} onChange={setNewArchivosRelacionados} label="Archivos relacionados" />
      </td>
      {/* 8. Ruta almacenamiento */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newRutaAlmacenamiento} onChange={(e) => setNewRutaAlmacenamiento(e.target.value)} onKeyDown={kd} placeholder="Ruta almac..." className={inputCls} />
      </td>
      {/* 9. Observaciones */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
      </td>
      {/* 10. Distribucion (FK select) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newDistribucionId} onChange={setNewDistribucionId} options={distribucionOpts} placeholder="Distribucion..." label="Distribucion" />
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
        title="Archivos"
        addLabel="Nuevo archivo"
        entityLabel="archivos"
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
      />
    </div>
  )
}
