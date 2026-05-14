import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { ProductoTabla, Producto, InformacionTablas } from '@/types'
import { getProductoTablas, createProductoTabla, deleteProductoTabla } from '../services/productoTablasService'
import { getProductos } from '@/features/productos/services/productosService'
import { getInformacionTablas } from '@/features/informacion_tablas/services/informacionTablasService'
import { productosIcon, informacionTablasIcon, fechaIcon, descripcionIcon } from '@/consts/sectionIcons'

export default function ProductoTablasPage() {
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<ProductoTabla[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [tablas, setTablas] = useState<InformacionTablas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newProductoId, setNewProductoId] = useState('')
  const [newTablaId, setNewTablaId] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(false)
    try {
      const [pts, prods, tbls] = await Promise.all([
        getProductoTablas(),
        getProductos(),
        getInformacionTablas(),
      ])
      setItems(pts)
      setProductos(prods)
      setTablas(tbls)
    } catch {
      setError(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewProductoId(''); setNewTablaId('') }

  const handleSaveRow = async () => {
    if (!newProductoId || !newTablaId) return
    try {
      await createProductoTabla({ producto_id: newProductoId, informacion_tablas_id: newTablaId })
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {}
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteProductoTabla(id)))
    await load(true)
  }

  const prodMap = Object.fromEntries(productos.map((p) => [p.id, p.nombre]))
  const tablaMap = Object.fromEntries(tablas.map((t) => [t.id, t.nombre]))

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return null
    try { return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [prodMap[i.producto_id], tablaMap[i.informacion_tablas_id], i.observaciones].some(
      (v) => String(v ?? '').toLowerCase().includes(q),
    )
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<ProductoTabla>[] = [
    {
      header: 'Producto',
      icon: productosIcon(),
      render: (r) => <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{prodMap[r.producto_id] ?? r.producto_id.slice(0, 8)}</span>,
      className: 'w-48',
      getValue: (r) => prodMap[r.producto_id] ?? '',
    },
    {
      header: 'Info. Tabla',
      icon: informacionTablasIcon(),
      render: (r) => <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-violet-500/10 text-violet-700">{tablaMap[r.informacion_tablas_id] ?? r.informacion_tablas_id.slice(0, 8)}</span>,
      className: 'w-48',
      getValue: (r) => tablaMap[r.informacion_tablas_id] ?? '',
    },
    {
      header: 'Fecha vinculacion',
      icon: fechaIcon(),
      render: (r) => <span className="text-ink/70 text-[12px]">{fmtDate(r.fecha_vinculacion) ?? '--'}</span>,
      getValue: (r) => r.fecha_vinculacion ?? '',
    },
    {
      header: 'Observaciones',
      icon: descripcionIcon(),
      render: (r) => <span className="text-ink/70 text-[13px]">{r.observaciones ?? '--'}</span>,
      getValue: (r) => r.observaciones ?? '',
    },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newProductoId}
          onChange={setNewProductoId}
          options={productos.map((p) => ({ value: p.id, label: p.nombre }))}
          placeholder="Producto..."
          label="Producto"
        />
      </td>
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput
          value={newTablaId}
          onChange={setNewTablaId}
          options={tablas.map((t) => ({ value: t.id, label: t.nombre }))}
          placeholder="Tabla..."
          label="Tabla"
        />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
    </>
  )

  const addRowActions = (
    <button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">x</button>
  )

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8" onKeyDown={addingRow ? kd : undefined}>
      <CatalogGrid
        eyebrow="Catalogo"
        title="Producto - Tablas"
        addLabel="Nueva vinculacion"
        entityLabel="vinculaciones"
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
