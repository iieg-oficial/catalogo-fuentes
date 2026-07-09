import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import ImportCsvButton from '@/components/ImportCsvButton'
import Button from '@/components/Button'
import Toast from '@/components/Toast'
import { useAuthContext } from '@/context/AuthContext'
import { useImportPreview } from '@/hooks/useImportPreview'
import type { Column } from '@/components/DataTable'
import type { Archivo, BaseDeDatos } from '@/types'
import { getBasesDeDatos, createBaseDeDatos, updateBaseDeDatos, deleteBaseDeDatos } from '../services/basesDeDatosService'
import { getArchivos } from '@/features/archivos/services/archivosService'
import { TextCell } from '@/components/TextCell'
import JsonEditorInput from '@/components/JsonEditorInput'
import { JsonCell } from '@/components/JsonCell'
import { nombreIcon, archivosIcon, jsonIcon, descripcionIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function BasesDeDatosPage() {
  const { canWrite, canManageUsers } = useAuthContext()
  const [items, setItems] = useState<BaseDeDatos[]>([])
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newArchivoId, setNewArchivoId] = useState('')
  const [newDescripcionEsquema, setNewDescripcionEsquema] = useState<Record<string, unknown>>({})
  const [newEtiquetas, setNewEtiquetas] = useState<Record<string, unknown>>({})

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [bds, arch] = await Promise.all([getBasesDeDatos(), getArchivos()])
      setItems(bds)
      setArchivos(arch)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const preview = useImportPreview<BaseDeDatos>('base_de_datos', () => load(true))

  const resetFields = () => { setNewNombre(''); setNewArchivoId(''); setNewDescripcionEsquema({}); setNewEtiquetas({}) }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createBaseDeDatos({
        db_nombre: newNombre,
        archivo_id: newArchivoId || undefined,
        descripcion_esquema: Object.keys(newDescripcionEsquema).length ? newDescripcionEsquema : undefined,
        etiquetas: Object.keys(newEtiquetas).length ? newEtiquetas : undefined,
      })
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditPrimaryCell = (row: BaseDeDatos, field: 'db_nombre', value: string) => {
    updateBaseDeDatos(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteBaseDeDatos(id)))
    await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.db_nombre, i.archivo?.nombre_archivo].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<BaseDeDatos>[] = [
    {
      header: 'Descripción esquema',
      icon: descripcionIcon(),
      className: 'w-48',
      render: (r) => <JsonCell value={r.descripcion_esquema} />,
      getValue: (r) => JSON.stringify(r.descripcion_esquema ?? {}),
      onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateBaseDeDatos(r.id, { descripcion_esquema: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, descripcion_esquema: parsed } : i))) } catch {} },
      inputType: 'json',
    },
    {
      header: 'Base de datos',
      icon: nombreIcon(),
      render: (r) => <TextCell value={r.db_nombre} />,
      getValue: (r) => r.db_nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'db_nombre', v),
    },
    {
      header: 'Archivo',
      icon: archivosIcon(),
      selectOptions: archivos.map((a) => ({ value: a.id, label: a.nombre_archivo })),
      onEdit: (r, v) => {
        updateBaseDeDatos(r.id, { archivo_id: v })
        setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, archivo_id: v || null, archivo: v ? { id: v, nombre_archivo: archivos.find((a) => a.id === v)?.nombre_archivo ?? '' } : null } : i)))
      },
      render: (r) => r.archivo
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.archivo.nombre_archivo}</span>
        : <span className="text-ink/60 text-[13px]">--</span>,
      getValue: (r) => r.archivo_id ?? '',
    },
    {
      header: 'Etiquetas',
      icon: jsonIcon(),
      render: (r) => <JsonCell value={r.etiquetas ?? {}} />,
      getValue: (r) => JSON.stringify(r.etiquetas ?? {}),
      onEdit: (r, v) => { try { const parsed = JSON.parse(v); updateBaseDeDatos(r.id, { etiquetas: parsed }); setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, etiquetas: parsed } : i))) } catch {} },
      inputType: 'json',
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newDescripcionEsquema} onChange={setNewDescripcionEsquema} label="Descripcion esquema" />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre BD..." className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newArchivoId}
          onChange={setNewArchivoId}
          options={archivos.map((a) => ({ value: a.id, label: a.nombre_archivo }))}
          placeholder="Archivo..."
          label="Archivo"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <JsonEditorInput value={newEtiquetas} onChange={setNewEtiquetas} label="Etiquetas" />
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
        title="Bases de datos"
        addLabel="Nueva base de datos"
        entityLabel="bases de datos"
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
        importSlot={canManageUsers ? (
          <div className="flex items-center gap-2">
            <ImportCsvButton entidad="base_de_datos" loading={preview.loading} onFileSelected={preview.requestPreview} />
            {preview.active && !preview.bloqueo && (
              <span className="text-[12px] text-ink/50">
                {preview.previewRows.length} a crear, {preview.duplicadosPreview} se omitirían por duplicado
              </span>
            )}
            {preview.active && (
              <>
                <Button size="sm" onClick={preview.confirm} disabled={!!preview.bloqueo || preview.loading}>Confirmar import</Button>
                <Button size="sm" variant="secondary" onClick={preview.cancel}>Cancelar</Button>
              </>
            )}
          </div>
        ) : undefined}
      />
      {preview.bloqueo && <p className="text-[13px] text-error-600 mt-2">{preview.bloqueo}</p>}
      {preview.resultado && (
        <Toast
          message={`${preview.resultado.creados} creados, ${preview.resultado.omitidos_duplicados.length} omitidos por duplicado`}
          variant="success"
          onClose={preview.clearResultado}
        />
      )}
    </div>
  )
}
