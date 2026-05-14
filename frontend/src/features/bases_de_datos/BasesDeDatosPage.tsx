import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { BaseDeDatos, Dataset } from '@/types'
import { getBasesDeDatos, createBaseDeDatos, updateBaseDeDatos, deleteBaseDeDatos } from './services/basesDeDatosService'
import { getDatasets } from '@/features/datasets/services/datasetsService'
import { nombreIcon, datasetsIcon, jsonIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function BasesDeDatosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<BaseDeDatos[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newDatasetId, setNewDatasetId] = useState('')
  const [newDescripcionEsquema, setNewDescripcionEsquema] = useState('')
  const [newMeta, setNewMeta] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [bds, ds] = await Promise.all([getBasesDeDatos(), getDatasets()])
      setItems(bds)
      setDatasets(ds)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewDatasetId(''); setNewDescripcionEsquema(''); setNewMeta('') }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createBaseDeDatos({
        db_nombre: newNombre,
        dataset_id: newDatasetId || undefined,
        descripcion_esquema: newDescripcionEsquema ? JSON.parse(newDescripcionEsquema) : undefined,
        meta: newMeta ? JSON.parse(newMeta) : undefined,
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
    return !q || [i.db_nombre, i.dataset?.nombre].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<BaseDeDatos>[] = [
    {
      header: 'Nombre BD',
      icon: nombreIcon(),
      render: (r) => <span className="font-medium text-ink">{r.db_nombre}</span>,
      className: 'w-48',
      getValue: (r) => r.db_nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'db_nombre', v),
    },
    {
      header: 'Dataset',
      icon: datasetsIcon(),
      selectOptions: datasets.map((d) => ({ value: d.id, label: d.nombre })),
      onEdit: (r, v) => {
        updateBaseDeDatos(r.id, { dataset_id: v })
        setItems((prev) => prev.map((i) => (i.id === r.id ? { ...i, dataset_id: v || null, dataset: v ? { id: v, nombre: datasets.find((d) => d.id === v)?.nombre ?? '' } : null } : i)))
      },
      render: (r) => r.dataset
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.dataset.nombre}</span>
        : <span className="text-ink/30 text-[13px]">--</span>,
      getValue: (r) => r.dataset_id ?? '',
    },
    {
      header: 'Descripcion esquema',
      icon: jsonIcon(),
      render: (r) => {
        const keys = Object.keys(r.descripcion_esquema ?? {})
        return keys.length
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-amber-500/10 text-amber-700">{keys.length} {keys.length === 1 ? 'campo' : 'campos'}</span>
          : <span className="text-ink/30 text-[13px]">--</span>
      },
      getValue: (r) => JSON.stringify(r.descripcion_esquema ?? {}),
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
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre BD..." className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newDatasetId}
          onChange={setNewDatasetId}
          options={datasets.map((d) => ({ value: d.id, label: d.nombre }))}
          placeholder="Dataset..."
          label="Dataset"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDescripcionEsquema} onChange={(e) => setNewDescripcionEsquema(e.target.value)} onKeyDown={kd} placeholder="JSON..." className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newMeta} onChange={(e) => setNewMeta(e.target.value)} onKeyDown={kd} placeholder="JSON..." className={inputCls} />
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
        title="Bases de datos"
        addLabel="Nueva base de datos"
        entityLabel="bases de datos"
        rows={filtered}
        columns={columns}
        getKey={(r) => r.id}
        onRowClick={(r) => navigate(`/bases-de-datos/${r.id}`)}
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
