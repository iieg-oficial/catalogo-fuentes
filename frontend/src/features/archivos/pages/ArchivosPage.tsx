import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import ImportControls from '@/components/ImportControls'
import { useAuthContext } from '@/context/AuthContext'
import { useImportPreview } from '@/hooks/useImportPreview'
import type { Column } from '@/components/DataTable'
import type { Archivo, Distribucion } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getArchivos, createArchivo, updateArchivo, deleteArchivo } from '../services/archivosService'
import { getDistribuciones } from '@/features/distribuciones/services/distribucionesService'
import DatePickerInput from '@/components/DatePickerInput'
import { nombreIcon, descripcionIcon, distribucionesIcon, fechaIcon } from '@/consts/sectionIcons'
import { ROL_ARCHIVO_OPTIONS } from '../consts/rolArchivo'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function ArchivosPage() {
  const { canWrite, canManageUsers } = useAuthContext()
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
  const [newObservaciones, setNewObservaciones] = useState('')
  const [newFechaObtencion, setNewFechaObtencion] = useState('')
  const [newFechaIngesta, setNewFechaIngesta] = useState('')
  const [newTamano, setNewTamano] = useState('')
  const [newHashSha256, setNewHashSha256] = useState('')
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

  const preview = useImportPreview<Archivo>('archivo', () => load(true))

  const resetFields = () => {
    setNewNombre(''); setNewRutaRelativa(''); setNewRol('')
    setNewObservaciones('')
    setNewFechaObtencion(''); setNewFechaIngesta(''); setNewTamano(''); setNewHashSha256('')
    setNewDistribucionId('')
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createArchivo({
        nombre_archivo: newNombre,
        ruta_relativa_en_distribucion: newRutaRelativa || undefined,
        rol_archivo: newRol || undefined,
        fecha_obtencion: newFechaObtencion || undefined,
        fecha_ingesta: newFechaIngesta || undefined,
        tamano_bytes: newTamano ? Number(newTamano) : undefined,
        hash_sha256: newHashSha256 || undefined,
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

  const distribucionOpts = distribuciones.map((d) => ({ value: d.id, label: d.distribucion_label }))

  const columns: Column<Archivo>[] = [
    {
      header: 'Nombre',
      icon: nombreIcon(),
      render: (r) => <TextCell value={r.nombre_archivo} />,
      className: 'w-48',
      getValue: (r) => r.nombre_archivo,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre_archivo', v),
    },
    {
      header: 'Distribución',
      icon: distribucionesIcon(),
      selectOptions: distribucionOpts,
      onEdit: (r, v) => {
        updateArchivo(r.id, { distribucion_id: v })
        const dist = distribuciones.find((d) => d.id === v)
        setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, distribucion_id: v || null, distribucion: dist ? { id: dist.id, distribucion: dist.distribucion } : null } : i)))
      },
      getValue: (r) => r.distribucion_id ?? '',
      // Filas reales: lookup por id en la lista cargada (trae el label compuesto).
      // Filas de preview del CSV: la distribucion viene anidada con su label.
      render: (r) => {
        const real = distribuciones.find((d) => d.id === r.distribucion_id)?.distribucion_label
        const anidada = r.distribucion as { distribucion_label?: string; distribucion?: string | null } | null
        return <TextCell value={real ?? anidada?.distribucion_label ?? anidada?.distribucion ?? null} />
      },
    },
    {
      header: 'Ruta en distribución',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.ruta_relativa_en_distribucion} mono />,
      getValue: (r) => r.ruta_relativa_en_distribucion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'ruta_relativa_en_distribucion', v),
    },
    {
      header: 'Rol archivo',
      icon: descripcionIcon(),
      selectOptions: ROL_ARCHIVO_OPTIONS,
      render: (r) => <TextCell value={r.rol_archivo} />,
      getValue: (r) => r.rol_archivo ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'rol_archivo', v),
    },
    {
      header: 'Fecha obtención',
      icon: fechaIcon(),
      render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_obtencion) ?? '--'}</span>,
      getValue: (r) => r.fecha_obtencion ? r.fecha_obtencion.slice(0, 10) : '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'fecha_obtencion', v),
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
      header: 'Fecha ingesta',
      icon: fechaIcon(),
      render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_ingesta) ?? '--'}</span>,
      getValue: (r) => r.fecha_ingesta ? r.fecha_ingesta.slice(0, 10) : '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'fecha_ingesta', v),
      inputType: 'date',
    },
    {
      header: 'Hash SHA-256',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.hash_sha256} mono />,
      getValue: (r) => r.hash_sha256 ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'hash_sha256', v),
    },
    {
      header: 'Observaciones',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.observaciones_archivo} />,
      getValue: (r) => r.observaciones_archivo ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'observaciones_archivo', v),
    },
  ]

  const addRowCells = (
    <>
      {/* 1. Nombre archivo */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre archivo..." className={inputCls} />
      </td>
      {/* 2. Distribucion (FK select) */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newDistribucionId} onChange={setNewDistribucionId} options={distribucionOpts} placeholder="Distribucion..." label="Distribucion" />
      </td>
      {/* 3. Ruta en distribucion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newRutaRelativa} onChange={(e) => setNewRutaRelativa(e.target.value)} onKeyDown={kd} placeholder="Ruta relativa..." className={inputCls} />
      </td>
      {/* 4. Rol archivo */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newRol} onChange={setNewRol} options={ROL_ARCHIVO_OPTIONS} placeholder="Rol archivo..." label="Rol archivo" />
      </td>
      {/* 5. Fecha obtencion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newFechaObtencion} onChange={setNewFechaObtencion} placeholder="Fecha obtencion..." onKeyDown={kd} />
      </td>
      {/* 6. Tamano (bytes) */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="number" value={newTamano} onChange={(e) => setNewTamano(e.target.value)} onKeyDown={kd} placeholder="Bytes..." className={inputCls} />
      </td>
      {/* 7. Fecha ingesta */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <DatePickerInput value={newFechaIngesta} onChange={setNewFechaIngesta} placeholder="Fecha ingesta..." onKeyDown={kd} />
      </td>
      {/* 8. Hash SHA-256 */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newHashSha256} onChange={(e) => setNewHashSha256(e.target.value)} onKeyDown={kd} placeholder="Hash SHA-256..." className={inputCls} />
      </td>
      {/* 9. Observaciones */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newObservaciones} onChange={(e) => setNewObservaciones(e.target.value)} onKeyDown={kd} placeholder="Observaciones..." className={inputCls} />
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
        previewRows={preview.previewRows}
        importSlot={canManageUsers ? <ImportControls preview={preview} entidad="archivo" /> : undefined}
      />
    </div>
  )
}
