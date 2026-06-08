import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import SelectInput from '@/components/SelectInput'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Fuente } from '@/types'
import { TextCell } from '@/components/TextCell'
import { getFuentes, createFuente, updateFuente, deleteFuente } from '../services/fuentesService'
import { nombreIcon, descripcionIcon, estadoIcon, urlIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function FuentesPage() {
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [items, setItems] = useState<Fuente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [addingRow, setAddingRow] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newNombreCorto, setNewNombreCorto] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSector, setNewSector] = useState('')
  const [newAmbito, setNewAmbito] = useState('')
  const [newEsFuenteOficial, setNewEsFuenteOficial] = useState('')
  const [newJurisdiccion, setNewJurisdiccion] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newEsPublicador, setNewEsPublicador] = useState('')
  const [newUrlTerminos, setNewUrlTerminos] = useState('')
  const [newUrlPrivacidad, setNewUrlPrivacidad] = useState('')
  const [newContacto, setNewContacto] = useState('')

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

  const resetFields = () => {
    setNewNombre(''); setNewNombreCorto(''); setNewDesc(''); setNewSector(''); setNewAmbito('')
    setNewEsFuenteOficial(''); setNewJurisdiccion(''); setNewUrl(''); setNewEsPublicador('')
    setNewUrlTerminos(''); setNewUrlPrivacidad(''); setNewContacto('')
  }

  const handleSaveRow = async () => {
    if (!newNombre.trim()) return
    try {
      await createFuente({
        nombre: newNombre,
        nombre_corto: newNombreCorto || undefined,
        descripcion: newDesc || undefined,
        sector: newSector || undefined,
        ambito: newAmbito || undefined,
        es_fuente_oficial: newEsFuenteOficial ? newEsFuenteOficial === 'true' : undefined,
        jurisdiccion: newJurisdiccion || undefined,
        url: newUrl || undefined,
        es_publicador: newEsPublicador ? newEsPublicador === 'true' : undefined,
        url_terminos_uso: newUrlTerminos || undefined,
        url_aviso_privacidad: newUrlPrivacidad || undefined,
        contacto_institucional: newContacto || undefined,
      })
      setAddingRow(false)
      resetFields()
      await load(true)
    } finally {
    }
  }

  const handleEditCell = (row: Fuente, field: string, value: string | boolean) => {
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
      render: (r) => <TextCell value={r.nombre} />,
      className: 'w-48',
      getValue: (r) => r.nombre,
      onEdit: (r, v) => handleEditCell(r, 'nombre', v),
    },
    {
      header: 'Nombre corto',
      icon: nombreIcon(),
      render: (r) => <TextCell value={r.nombre_corto} />,
      getValue: (r) => r.nombre_corto ?? '',
      onEdit: (r, v) => handleEditCell(r, 'nombre_corto', v),
    },
    {
      header: 'Sector',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.sector} />,
      getValue: (r) => r.sector ?? '',
      onEdit: (r, v) => handleEditCell(r, 'sector', v),
    },
    {
      header: 'Ambito',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.ambito} />,
      getValue: (r) => r.ambito ?? '',
      onEdit: (r, v) => handleEditCell(r, 'ambito', v),
    },
    {
      header: 'Oficial',
      icon: estadoIcon(),
      render: (r) => r.es_fuente_oficial
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span>,
      selectOptions: [{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }],
      onEdit: (r, v) => handleEditCell(r, 'es_fuente_oficial', v === 'true'),
      getValue: (r) => r.es_fuente_oficial ? 'true' : 'false',
    },
    {
      header: 'Jurisdiccion',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.jurisdiccion} />,
      getValue: (r) => r.jurisdiccion ?? '',
      onEdit: (r, v) => handleEditCell(r, 'jurisdiccion', v),
    },
    {
      header: 'URL',
      icon: urlIcon(),
      render: (r) => <TextCell value={r.url} mono link />,
      getValue: (r) => r.url ?? '',
      onEdit: (r, v) => handleEditCell(r, 'url', v),
    },
    {
      header: 'Descripción',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.descripcion} />,
      getValue: (r) => r.descripcion ?? '',
      onEdit: (r, v) => handleEditCell(r, 'descripcion', v),
    },
    {
      header: 'Publicador',
      icon: estadoIcon(),
      render: (r) => r.es_publicador
        ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-green-500/10 text-green-700">Si</span>
        : <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-red-500/10 text-red-700">No</span>,
      selectOptions: [{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }],
      onEdit: (r, v) => handleEditCell(r, 'es_publicador', v === 'true'),
      getValue: (r) => r.es_publicador ? 'true' : 'false',
    },
    {
      header: 'URL terminos uso',
      icon: urlIcon(),
      render: (r) => <TextCell value={r.url_terminos_uso} mono link />,
      getValue: (r) => r.url_terminos_uso ?? '',
      onEdit: (r, v) => handleEditCell(r, 'url_terminos_uso', v),
    },
    {
      header: 'URL aviso privacidad',
      icon: urlIcon(),
      render: (r) => <TextCell value={r.url_aviso_privacidad} mono link />,
      getValue: (r) => r.url_aviso_privacidad ?? '',
      onEdit: (r, v) => handleEditCell(r, 'url_aviso_privacidad', v),
    },
    {
      header: 'Contacto institucional',
      icon: descripcionIcon(),
      render: (r) => <TextCell value={r.contacto_institucional} />,
      getValue: (r) => r.contacto_institucional ?? '',
      onEdit: (r, v) => handleEditCell(r, 'contacto_institucional', v),
    },
  ]

  const addRowCells = (
    <>
      {/* 1. Nombre */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={kd} placeholder="Nombre..." className={inputCls} />
      </td>
      {/* 2. Nombre corto */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newNombreCorto} onChange={(e) => setNewNombreCorto(e.target.value)} onKeyDown={kd} placeholder="Nombre corto..." className={inputCls} />
      </td>
      {/* 3. Sector */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newSector} onChange={(e) => setNewSector(e.target.value)} onKeyDown={kd} placeholder="Sector..." className={inputCls} />
      </td>
      {/* 4. Ambito */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newAmbito} onChange={(e) => setNewAmbito(e.target.value)} onKeyDown={kd} placeholder="Ambito..." className={inputCls} />
      </td>
      {/* 5. Oficial */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newEsFuenteOficial} onChange={setNewEsFuenteOficial} options={[{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]} placeholder="Oficial..." label="Oficial" />
      </td>
      {/* 6. Jurisdiccion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newJurisdiccion} onChange={(e) => setNewJurisdiccion(e.target.value)} onKeyDown={kd} placeholder="Jurisdiccion..." className={inputCls} />
      </td>
      {/* 7. URL */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={kd} placeholder="URL..." className={inputCls} />
      </td>
      {/* 8. Descripcion */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} onKeyDown={kd} placeholder="Descripcion..." className={inputCls} />
      </td>
      {/* 9. Publicador */}
      <td className="px-2.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <SelectInput value={newEsPublicador} onChange={setNewEsPublicador} options={[{ value: 'true', label: 'Si' }, { value: 'false', label: 'No' }]} placeholder="Publicador..." label="Publicador" />
      </td>
      {/* 10. URL terminos uso */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlTerminos} onChange={(e) => setNewUrlTerminos(e.target.value)} onKeyDown={kd} placeholder="URL terminos..." className={inputCls} />
      </td>
      {/* 11. URL aviso privacidad */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newUrlPrivacidad} onChange={(e) => setNewUrlPrivacidad(e.target.value)} onKeyDown={kd} placeholder="URL privacidad..." className={inputCls} />
      </td>
      {/* 12. Contacto institucional */}
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input value={newContacto} onChange={(e) => setNewContacto(e.target.value)} onKeyDown={kd} placeholder="Contacto..." className={inputCls} />
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
