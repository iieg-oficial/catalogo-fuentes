import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import CatalogGrid from '@/components/CatalogGrid'
import { useAuthContext } from '@/context/AuthContext'
import type { Column } from '@/components/DataTable'
import type { Usuario } from '@/types'
import { getUsuarios, createUsuario, deleteUsuario } from '../services/usuariosService'
import { nombreIcon, correoIcon, rolIcon, estadoIcon } from '@/consts/sectionIcons'

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150'

export default function UsuariosPage() {
  const { canManageUsers } = useAuthContext()
  const [items, setItems] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [addingRow, setAddingRow] = useState(false)
  const [newCorreo, setNewCorreo] = useState('')

  const load = async (silent = false) => {
    if (!silent) setLoading(true); setError(false)
    try { setItems(await getUsuarios()) } catch { setError(true) } finally { if (!silent) setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const resetFields = () => { setNewCorreo('') }

  const handleSaveRow = async () => {
    if (!newCorreo.trim()) return
    try { await createUsuario({ correo: newCorreo }); setAddingRow(false); resetFields(); await load(true) } finally {}
  }

  const handleDeleteRows = async (keys: string[]) => {
    await Promise.all(keys.map((id) => deleteUsuario(id))); await load(true)
  }

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return !q || [i.nombre, i.correo, i.rol?.nombre].some((v) => String(v ?? '').toLowerCase().includes(q))
  })

  const kd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRow()
    if (e.key === 'Escape') { setAddingRow(false); resetFields() }
  }

  const columns: Column<Usuario>[] = [
    { header: 'Nombre', icon: nombreIcon(), render: (r) => <span className="font-medium text-ink">{r.nombre ?? r.correo}</span>, className: 'w-48', getValue: (r) => r.nombre ?? '' },
    { header: 'Correo', icon: correoIcon(), render: (r) => <span className="text-ink/70 text-[13px] font-mono">{r.correo}</span>, getValue: (r) => r.correo },
    { header: 'Rol', icon: rolIcon(), render: (r) => r.rol ? <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium bg-brand-500/10 text-brand-700">{r.rol.nombre}</span> : <span className="text-ink/30 text-[13px]">--</span>, getValue: (r) => r.rol?.nombre ?? '' },
    { header: 'Estado', icon: estadoIcon(), render: (r) => r.activo ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[12px] font-medium bg-emerald-50 text-emerald-700"><span className="w-[5px] h-[5px] rounded-full bg-emerald-500" />Activo</span> : <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[12px] font-medium bg-ink/[6%] text-ink/50"><span className="w-[5px] h-[5px] rounded-full bg-ink/30" />Inactivo</span>, getValue: (r) => r.activo ? 'Activo' : 'Inactivo' },
  ]

  const addRowCells = (
    <>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }}>
        <input autoFocus required value={newCorreo} onChange={(e) => setNewCorreo(e.target.value)} onKeyDown={kd} placeholder="Correo..." className={inputCls} />
      </td>
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
      <td className="px-2.5 py-1.5 border-r border-ink/[5%]" style={{ height: 40 }} />
    </>
  )

  const addRowActions = (<button onClick={() => { setAddingRow(false); resetFields() }} className="text-ink/30 hover:text-ink/60" title="Cancelar">x</button>)

  if (loading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
  if (error) return <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>

  return (
    <div className="flex-1 min-h-0 overflow-auto p-8">
      <CatalogGrid eyebrow="Administracion" title="Usuarios" addLabel="Nuevo usuario" entityLabel="usuarios" rows={filtered} columns={columns} getKey={(r) => r.id} canWrite={canManageUsers} onAdd={canManageUsers ? () => setAddingRow(true) : undefined} addRowCells={canManageUsers && addingRow ? addRowCells : undefined} addRowActions={canManageUsers && addingRow ? addRowActions : undefined} onAddRowSave={canManageUsers && addingRow ? handleSaveRow : undefined} onDeleteRows={canManageUsers ? handleDeleteRows : undefined} search={search} onSearch={setSearch} />
    </div>
  )
}
