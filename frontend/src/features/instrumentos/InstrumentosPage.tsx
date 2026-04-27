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
import type { Instrumento, BaseDeDatos } from '@/types'
import { getInstrumentos, createInstrumento, updateInstrumento, deleteInstrumento } from './services/instrumentosService'
import { getBasesDeDatos } from '@/features/bases_de_datos/services/basesDeDatosService'
import { nombreIcon, basesDeDatosIcon, fechaIcon, descripcionIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function InstrumentosPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Instrumento[]>([])
  const [bases, setBases] = useState<BaseDeDatos[]>([])
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
  const [newNombre, setNewNombre] = useState('')
  const [newBdId, setNewBdId] = useState('')
  const [newFecha, setNewFecha] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [addRowMeta, setAddRowMeta] = useState<Record<string, string>>({})

  const { allMetaCols, addColumn, deleteColumn, updateColumn, getMeta, canModifyCol } = useMetaColumns(items, 'instrumentos')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [instrs, bds] = await Promise.all([getInstrumentos(), getBasesDeDatos()])
      setItems(instrs)
      setBases(bds)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewNombre(''); setNewBdId(''); setNewFecha(''); setNewDesc(''); setAddRowMeta({}) }

  const handleSaveRow = async () => {
    if (!newNombre.trim() || !newBdId) return
    try {
      const created = await createInstrumento({
        nombre: newNombre,
        base_de_datos_id: newBdId,
        fecha_publicacion: newFecha || undefined,
        descripcion: newDesc || undefined,
      })
      if (Object.values(addRowMeta).some(Boolean)) {
        await updateInstrumento(created.id, { meta: addRowMeta })
      }
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditPrimaryCell = (row: Instrumento, field: 'nombre' | 'descripcion' | 'fecha_publicacion', value: string) => {
    updateInstrumento(row.id, { [field]: value })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, [field]: value } : i)))
  }

  const handleEditBaseDeDatos = (row: Instrumento, bdId: string) => {
    const bd = bases.find((b) => b.id === bdId) ?? undefined
    updateInstrumento(row.id, { base_de_datos_id: bdId })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, base_de_datos_id: bdId, base_de_datos: bd } : i)))
  }

  const handleEditMetaCell = (row: Instrumento, key: string, value: string) => {
    const nm = { ...row.meta, [key]: value }
    updateInstrumento(row.id, { meta: nm })
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, meta: nm } : i)))
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteInstrumento(id)))
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
    return !q || [i.nombre, i.descripcion, i.fecha_publicacion, i.base_de_datos?.nombre, ...Object.values(i.meta)].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Instrumento>[] = [
    {
      header: 'Nombre',
      icon: nombreIcon(),
      render: (r) => <span className="font-medium text-ink">{r.nombre}</span>,
      className: 'w-56',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditPrimaryCell(r, 'nombre', v),
    },
    {
      header: 'Base de datos',
      icon: basesDeDatosIcon(),
      render: (r) => r.base_de_datos
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.base_de_datos.nombre}</span>
        : <span className="text-ink/30 text-[13px]">—</span>,
      getValue: (r) => r.base_de_datos_id ?? '',
      onEdit: handleEditBaseDeDatos,
      selectOptions: bases.map((b) => ({ value: b.id, label: b.nombre })),
    },
    {
      header: 'Fecha publicación',
      icon: fechaIcon(),
      render: (r) => {
        if (!r.fecha_publicacion) return <span className="text-ink/30 text-[13px]">—</span>
        try {
          const fmt = new Date(r.fecha_publicacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
          return <span className="text-ink/70 text-[12px]">{fmt}</span>
        } catch {
          return <span className="text-ink/70 text-[13px]">{r.fecha_publicacion}</span>
        }
      },
      getValue: (r) => r.fecha_publicacion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'fecha_publicacion', v),
    },
    {
      header: 'Descripción',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.descripcion ?? '—'}</span>,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditPrimaryCell(r, 'descripcion', v),
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre…" className={inputCls} />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newBdId}
          onChange={setNewBdId}
          options={bases.map((b) => ({ value: b.id, label: b.nombre }))}
          placeholder="Base de datos…"
          label="Base de datos"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input type="date" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripción…" className={inputCls} />
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
          title="Instrumentos"
          addLabel="Nuevo instrumento"
          entityLabel="instrumentos"
          rows={filtered}
          columns={columns}
          getKey={(r) => r.id}
          onRowClick={(r) => navigate(`/instrumentos/${r.id}`)}
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
