import { CSSProperties, FormEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { Usuario, Rol } from '@/types'
import { getUsuarios, createUsuario, updateUsuario } from '../services/usuariosService'
import { getRoles } from '../services/rolesService'
import { cuentaIcon, correoIcon, rolIcon, estadoIcon, relojIcon } from '@/consts/sectionIcons'

const ROLE_AVATAR_BG: Record<string, string> = {
  superadmin: 'bg-purple-600',
  admin:      'bg-orange-500',
  maintainer: 'bg-yellow-500',
  visualizer: 'bg-neutral-400',
  viewer:     'bg-neutral-400',
}

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700 border border-purple-200',
  admin:      'bg-orange-100 text-orange-700 border border-orange-200',
  maintainer: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  visualizer: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  viewer:     'bg-neutral-100 text-neutral-600 border border-neutral-200',
}

const PAGE_SIZES = [10, 20, 50]

function getInitials(correo: string): string {
  const local = correo.split('@')[0]
  const parts = local.split(/[._-]/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : local.slice(0, 2).toUpperCase()
}

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase()
}

function usePortalDropdown() {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  const openPanel = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPanelStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, zIndex: 9999 })
    }
    setOpen(true)
  }

  return { open, setOpen, panelStyle, triggerRef, panelRef, openPanel }
}

function CheckList({
  options,
  selected,
  onSelect,
  onClose,
}: {
  options: { value: string; label: string }[]
  selected: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="py-1.5">
        {options.map((opt) => {
          const isChecked = opt.value === selected
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value); onClose() }}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors duration-100 ${
                isChecked ? 'text-brand-700 bg-brand-500/[5%]' : 'text-ink/70 hover:bg-ink/[3%]'
              }`}
            >
              <span className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors duration-100 ${
                isChecked ? 'bg-brand-600 border-brand-600' : 'border-ink/[18%] bg-white'
              }`}>
                {isChecked && (
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.5 5L4 7.5 8.5 2.5" />
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          )
        })}
      </div>
      <div className="border-t border-ink/[6%] px-2 py-1.5">
        <button
          onClick={onClose}
          className="w-full px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-500/[6%] rounded-md transition-colors"
        >
          Listo
        </button>
      </div>
    </>
  )
}

function Avatar({ correo, rolNombre }: { correo: string; rolNombre: string }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${ROLE_AVATAR_BG[rolNombre] ?? 'bg-neutral-400'}`}>
      {getInitials(correo)}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        checked ? 'bg-brand-600' : 'bg-neutral-300'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  )
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const { open, setOpen, panelStyle, triggerRef, panelRef, openPanel } = usePortalDropdown()
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-ink/[10%] rounded-lg text-[13px] text-ink/70 shadow-sm hover:bg-ink/[2%] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
      >
        <span className="font-medium text-ink/40">{label}:</span>
        <span className="font-medium">{selected?.label ?? label}</span>
        <svg className="text-ink/30 shrink-0" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && createPortal(
        <div ref={panelRef} style={panelStyle} className="bg-white border border-ink/[10%] rounded-xl shadow-xl shadow-ink/[6%] min-w-[160px] overflow-hidden">
          <CheckList options={options} selected={value} onSelect={onChange} onClose={() => setOpen(false)} />
        </div>,
        document.body,
      )}
    </>
  )
}

function FormDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const { open, setOpen, panelStyle, triggerRef, panelRef, openPanel } = usePortalDropdown()
  const selected = options.find((o) => o.value === value)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-ink/[12%] rounded-lg bg-white text-ink/70 focus:outline-none hover:border-ink/[20%] transition-colors"
      >
        <span>{selected?.label ?? '—'}</span>
        <svg className="text-ink/30 shrink-0" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && createPortal(
        <div ref={panelRef} style={panelStyle} className="bg-white border border-ink/[10%] rounded-xl shadow-xl shadow-ink/[6%] min-w-[200px] overflow-hidden">
          <CheckList options={options} selected={value} onSelect={onChange} onClose={() => setOpen(false)} />
        </div>,
        document.body,
      )}
    </>
  )
}

function RoleDropdown({
  rolNombre,
  allRoles,
  onChange,
}: {
  rolNombre: string
  allRoles: Rol[]
  onChange: (rolId: string) => void
}) {
  const { open, setOpen, panelStyle, triggerRef, panelRef, openPanel } = usePortalDropdown()
  const roleOptions = allRoles.map((r) => ({ value: r.id, label: r.nombre }))
  const currentRolId = allRoles.find((r) => r.nombre === rolNombre)?.id ?? ''

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${ROLE_BADGE[rolNombre] ?? 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}
      >
        {rolNombre}
        <svg className="opacity-60 shrink-0" width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && createPortal(
        <div ref={panelRef} style={panelStyle} className="bg-white border border-ink/[10%] rounded-xl shadow-xl shadow-ink/[6%] min-w-[150px] overflow-hidden">
          <CheckList options={roleOptions} selected={currentRolId} onSelect={(id) => onChange(id)} onClose={() => setOpen(false)} />
        </div>,
        document.body,
      )}
    </>
  )
}

export default function UsuariosPage() {
  const { user: currentUser, isSuperAdmin, canManageUsers } = useAuthContext()
  const isAdmin = currentUser?.rol?.nombre === 'admin'

  const [users, setUsers] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formCorreo, setFormCorreo] = useState('')
  const [formRolId, setFormRolId] = useState('')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const [u, r] = await Promise.all([getUsuarios(), getRoles()])
      setUsers(u)
      setRoles(r)
    } catch { setError(true) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  useEffect(() => { setPage(1) }, [search, filterRole, filterStatus, pageSize])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const u = await createUsuario({
        correo: formCorreo,
        rol_id: formRolId || undefined,
      })
      setUsers((prev) => [...prev, u])
      setShowForm(false)
      setFormCorreo('')
      setFormRolId('')
    } catch {
      setFormError('No se pudo crear el usuario. Verifica que el correo no esté registrado.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (usuario: Usuario) => {
    const next = !usuario.activo
    setUsers((prev) => prev.map((u) =>
      u.id === usuario.id ? { ...u, activo: next } : u
    ))
    try {
      await updateUsuario(usuario.id, { activo: next })
    } catch {
      setUsers((prev) => prev.map((u) =>
        u.id === usuario.id ? { ...u, activo: usuario.activo } : u
      ))
    }
  }

  const handleChangeRole = async (usuario: Usuario, rolId: string) => {
    const newRol = roles.find((r) => r.id === rolId) ?? null
    setUsers((prev) => prev.map((u) =>
      u.id === usuario.id ? { ...u, rol_id: rolId, rol: newRol } : u
    ))
    try {
      await updateUsuario(usuario.id, { rol_id: rolId })
    } catch {
      setUsers((prev) => prev.map((u) =>
        u.id === usuario.id ? { ...u, rol_id: usuario.rol_id, rol: usuario.rol } : u
      ))
    }
  }

  const canEditRole = (target: Usuario): boolean => {
    if (target.rol?.nombre === 'superadmin') return false
    if (isSuperAdmin) return true
    if (isAdmin) return target.rol?.nombre !== 'admin'
    return false
  }

  const allowedRoles = (): Rol[] => {
    if (isSuperAdmin) return roles.filter((r) => ['admin', 'maintainer', 'viewer'].includes(r.nombre))
    if (isAdmin) return roles.filter((r) => ['maintainer', 'viewer'].includes(r.nombre))
    return []
  }

  const scoreMatch = (query: string, text: string): number => {
    if (!query.trim() || !text) return 0
    const q = query.toLowerCase().trim()
    const t = text.toLowerCase()

    if (t === q) return 100
    if (t.startsWith(q)) return 95
    if (t.includes(q)) return 85

    const qWords = q.split(/\s+/).filter((w) => w.length >= 2)
    if (qWords.length > 0) {
      const matched = qWords.filter((w) => t.includes(w)).length
      if (matched === qWords.length) return 75
      if (matched > 0) return 40 + Math.round((matched / qWords.length) * 30)
    }

    let qi = 0
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) qi++
    }
    if (qi === q.length) return 15 + Math.round((q.length / t.length) * 20)

    if (q.length >= 3 && t.length >= 3) {
      const trigrams = (s: string) => {
        const set = new Set<string>()
        for (let i = 0; i <= s.length - 3; i++) set.add(s.slice(i, i + 3))
        return set
      }
      const qg = trigrams(q)
      const tg = trigrams(t)
      let common = 0
      qg.forEach((g) => { if (tg.has(g)) common++ })
      const sim = (2 * common) / (qg.size + tg.size)
      if (sim > 0.2) return Math.round(sim * 35)
    }

    return 0
  }

  const filtered = users.filter((u) => {
    if (filterRole && u.rol?.nombre !== filterRole) return false
    if (filterStatus === 'active' && !u.activo) return false
    if (filterStatus === 'inactive' && u.activo) return false
    if (search) {
      const text = [u.nombre, u.correo, u.rol?.nombre].filter(Boolean).map(String).join(' ')
      return scoreMatch(search, text) > 10
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const paginated = filtered.slice(start, start + pageSize)

  return (
    <div className="flex-1 overflow-auto p-6 bg-neutral-50">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Gestión de usuarios</h1>
          <p className="text-xs text-ink/70 mt-0.5">
            Administra los niveles de acceso y permisos del personal.
          </p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
          >
            <span className="text-base leading-none">+</span>
            Crear usuario
          </button>
        )}
      </div>

      {/* Create modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-ink">Nuevo usuario</h3>
              <button onClick={() => setShowForm(false)} className="text-ink/30 hover:text-ink/60 transition-colors">
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3L3 11" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1">Correo</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-ink/[12%] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="usuario@iieg.gob.mx"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1">Rol</label>
                <FormDropdown
                  value={formRolId}
                  options={roles.map((r) => ({ value: r.id, label: r.nombre }))}
                  onChange={setFormRolId}
                />
              </div>
              {formError && <p className="text-xs text-red-600">{formError}</p>}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {formLoading ? 'Creando…' : 'Crear'}
              </button>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* Filter row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Rol"
            value={filterRole}
            onChange={setFilterRole}
            options={[
              { value: '', label: 'Todos los roles' },
              ...roles.map((r) => ({ value: r.nombre, label: r.nombre })),
            ]}
          />
          <FilterDropdown
            label="Estado"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: 'Todos' },
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
            ]}
          />
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario…"
              className="pl-8 pr-3 py-1.5 w-48 bg-white border border-ink/[10%] rounded-lg text-[13px] text-ink/70 shadow-sm placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
        </div>
        <span className="text-xs text-ink/60">
          {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>
      ) : (
        <div className="bg-white border border-ink/[10%] rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/[6%]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/70 uppercase">
                  <span className="inline-flex items-center gap-1.5">{cuentaIcon()}<span>Cuenta</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/70 uppercase">
                  <span className="inline-flex items-center gap-1.5">{correoIcon()}<span>Correo electrónico</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/70 uppercase">
                  <span className="inline-flex items-center gap-1.5">{rolIcon()}<span>Rol</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/70 uppercase">
                  <span className="inline-flex items-center gap-1.5">{estadoIcon()}<span>Estado</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/70 uppercase">
                  <span className="inline-flex items-center gap-1.5">{relojIcon()}<span>Último acceso</span></span>
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((usuario) => {
                const rolNombre = usuario.rol?.nombre ?? 'viewer'
                return (
                  <tr key={usuario.id} className="border-b border-ink/[4%] last:border-0 hover:bg-ink/[2%] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar correo={usuario.correo} rolNombre={rolNombre} />
                        <div>
                          <p className="font-semibold text-ink leading-tight">{usuario.nombre ?? usuario.correo.split('@')[0]}</p>
                          <p className="text-[11px] text-ink/40 leading-tight mt-0.5">ID: {shortId(usuario.id)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-ink/70 text-xs">{usuario.correo}</td>

                    <td className="px-5 py-3">
                      {canEditRole(usuario) ? (
                        <RoleDropdown
                          rolNombre={rolNombre}
                          allRoles={allowedRoles()}
                          onChange={(rolId) => handleChangeRole(usuario, rolId)}
                        />
                      ) : (
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${ROLE_BADGE[rolNombre] ?? 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
                          {rolNombre}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      {rolNombre !== 'superadmin' && canManageUsers ? (
                        <div className="flex items-center gap-2">
                          <ToggleSwitch checked={usuario.activo} onChange={() => handleToggleActive(usuario)} />
                          {!usuario.activo && (
                            <span className="text-xs font-medium text-red-500">Desactivado</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-ink/60">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-xs text-ink/40">—</td>

                    <td className="px-5 py-3 text-right">
                      <button className="p-1 rounded text-ink/60 hover:text-ink/80 hover:bg-ink/[5%] transition-colors" aria-label="Más acciones">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink/40">
                    No hay usuarios que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-ink/[6%] bg-neutral-50/50">
            <div className="flex items-center gap-2 text-xs text-ink/70">
              <span>Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-ink/[10%] rounded px-1.5 py-0.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-3 text-xs text-ink/70 cursor-default">
                <span>
                  {filtered.length === 0 ? '0' : `${start + 1}–${Math.min(start + pageSize, filtered.length)}`}
                  {' '}de {filtered.length}
                </span>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded border border-ink/[10%] bg-white hover:bg-ink/[4%] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.5 2L4 6l3.5 4" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded border border-ink/[10%] bg-white hover:bg-ink/[4%] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 2L8 6l-3.5 4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
