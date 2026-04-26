import { CSSProperties, FormEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { User, UserRole } from '@/types'
import { createUser, getUsers, updateUser } from './services/usersService'
import { cuentaIcon, correoIcon, rolIcon, estadoIcon, relojIcon } from '@/consts/sectionIcons'

// ─── Role styling ────────────────────────────────────────────────────────────

const ROLE_AVATAR_BG: Record<UserRole, string> = {
  superadmin: 'bg-purple-600',
  admin:      'bg-orange-500',
  maintainer: 'bg-yellow-500',
  visualizer: 'bg-neutral-400',
  viewer:     'bg-neutral-400',
}

const ROLE_BADGE: Record<UserRole, string> = {
  superadmin: 'bg-purple-100 text-purple-700 border border-purple-200',
  admin:      'bg-orange-100 text-orange-700 border border-orange-200',
  maintainer: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  visualizer: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  viewer:     'bg-neutral-100 text-neutral-600 border border-neutral-200',
}

const PAGE_SIZES = [10, 20, 50]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(email: string): string {
  const local = email.split('@')[0]
  const parts = local.split(/[._-]/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : local.slice(0, 2).toUpperCase()
}

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase()
}

// ─── Shared portal hook ───────────────────────────────────────────────────────

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

// ─── Shared checkbox list ─────────────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ email, role }: { email: string; role: UserRole }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${ROLE_AVATAR_BG[role]}`}>
      {getInitials(email)}
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-ink/[10%] rounded-lg text-[13px] text-ink/70 shadow-sm hover:bg-ink/[2%] transition-colors"
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
  value,
  options,
  onChange,
}: {
  value: UserRole
  options: UserRole[]
  onChange: (r: UserRole) => void
}) {
  const { open, setOpen, panelStyle, triggerRef, panelRef, openPanel } = usePortalDropdown()
  const roleOptions = options.map((r) => ({ value: r, label: r }))

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${ROLE_BADGE[value]}`}
      >
        {value}
        <svg className="opacity-60 shrink-0" width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && createPortal(
        <div ref={panelRef} style={panelStyle} className="bg-white border border-ink/[10%] rounded-xl shadow-xl shadow-ink/[6%] min-w-[150px] overflow-hidden">
          <CheckList options={roleOptions} selected={value} onSelect={(r) => onChange(r as UserRole)} onClose={() => setOpen(false)} />
        </div>,
        document.body,
      )}
    </>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuthContext()
  const isAdmin = currentUser?.role === 'admin'

  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)
  const [filterRole, setFilterRole]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole]   = useState<UserRole>('visualizer')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(20)

  const load = async () => {
    setLoading(true)
    setError(false)
    try { setUsers(await getUsers()) }
    catch { setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  useEffect(() => { setPage(1) }, [filterRole, filterStatus, pageSize])

  // ── Handlers ──

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const u = await createUser(formEmail, formRole)
      setUsers((prev) => [...prev, u])
      setShowForm(false)
      setFormEmail('')
      setFormRole('visualizer')
    } catch {
      setFormError('No se pudo crear el usuario. Verifica que el email no esté registrado.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const updated = await updateUser(user.id, { is_active: !user.is_active })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch { /* silent */ }
  }

  const handleChangeRole = async (user: User, role: UserRole) => {
    try {
      const updated = await updateUser(user.id, { role })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch { /* silent */ }
  }

  // ── Permissions ──

  const canEditRole = (target: User): boolean => {
    if (target.role === 'superadmin') return false
    if (isSuperAdmin) return true
    if (isAdmin) return target.role !== 'admin'
    return false
  }

  const allowedRoles = (): UserRole[] => {
    if (isSuperAdmin) return ['admin', 'maintainer', 'visualizer']
    if (isAdmin)      return ['maintainer', 'visualizer']
    return []
  }

  // ── Filtering & pagination ──

  const filtered = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus === 'active'   && !u.is_active) return false
    if (filterStatus === 'inactive' &&  u.is_active) return false
    return true
  })

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage    = Math.min(page, totalPages)
  const start       = (safePage - 1) * pageSize
  const paginated   = filtered.slice(start, start + pageSize)

  // ── Render ──

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto p-6 bg-neutral-50">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Gestión de usuarios</h1>
          <p className="text-xs text-ink/40 mt-0.5">
            Administra los niveles de acceso y permisos del personal.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          {showForm ? 'Cancelar' : 'Crear usuario'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-ink/[10%] rounded-xl p-5 mb-5 max-w-sm shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-4">Nuevo usuario</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-ink/[12%] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="usuario@iieg.gob.mx"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1">Rol</label>
              <FormDropdown
                value={formRole}
                options={[
                  { value: 'visualizer', label: 'Visualizer' },
                  { value: 'maintainer', label: 'Maintainer' },
                  ...(isSuperAdmin ? [
                    { value: 'admin', label: 'Admin' },
                    { value: 'superadmin', label: 'Superadmin' },
                  ] : []),
                ]}
                onChange={(v) => setFormRole(v as UserRole)}
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
              { value: 'superadmin', label: 'Superadmin' },
              { value: 'admin', label: 'Admin' },
              { value: 'maintainer', label: 'Maintainer' },
              { value: 'visualizer', label: 'Visualizer' },
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
        </div>
        <span className="text-xs text-ink/40">
          {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>
      ) : (
        <div className="bg-white border border-ink/[10%] rounded-xl overflow-hidden shadow-sm flex flex-col">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/[6%]">
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/40 uppercase">
                  <span className="inline-flex items-center gap-1.5">{cuentaIcon()}<span>Cuenta</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/40 uppercase">
                  <span className="inline-flex items-center gap-1.5">{correoIcon()}<span>Correo electrónico</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/40 uppercase">
                  <span className="inline-flex items-center gap-1.5">{rolIcon()}<span>Rol</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/40 uppercase">
                  <span className="inline-flex items-center gap-1.5">{estadoIcon()}<span>Estado</span></span>
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-ink/40 uppercase">
                  <span className="inline-flex items-center gap-1.5">{relojIcon()}<span>Último acceso</span></span>
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr key={user.id} className="border-b border-ink/[4%] last:border-0 hover:bg-ink/[2%] transition-colors">

                  {/* CUENTA */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar email={user.email} role={user.role} />
                      <div>
                        <p className="font-semibold text-ink leading-tight">{user.email.split('@')[0]}</p>
                        <p className="text-[11px] text-ink/40 leading-tight mt-0.5">ID: {shortId(user.id)}</p>
                      </div>
                    </div>
                  </td>

                  {/* CORREO */}
                  <td className="px-5 py-3 text-ink/50 text-xs">{user.email}</td>

                  {/* ROL */}
                  <td className="px-5 py-3">
                    {canEditRole(user) ? (
                      <RoleDropdown
                        value={user.role}
                        options={allowedRoles()}
                        onChange={(r) => handleChangeRole(user, r)}
                      />
                    ) : (
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                        {user.role}
                      </span>
                    )}
                  </td>

                  {/* ESTADO */}
                  <td className="px-5 py-3">
                    {user.role !== 'superadmin' ? (
                      <div className="flex items-center gap-2">
                        <ToggleSwitch checked={user.is_active} onChange={() => handleToggleActive(user)} />
                        {!user.is_active && (
                          <span className="text-xs font-medium text-red-500">Desactivado</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink/20">—</span>
                    )}
                  </td>

                  {/* ÚLTIMO ACCESO */}
                  <td className="px-5 py-3 text-xs text-ink/40">—</td>

                  {/* ACCIONES */}
                  <td className="px-5 py-3 text-right">
                    <button className="p-1 rounded text-ink/20 hover:text-ink/50 hover:bg-ink/[5%] transition-colors" title="Más acciones">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}

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
            <div className="flex items-center gap-2 text-xs text-ink/50">
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
              <div className="flex items-center gap-3 text-xs text-ink/50">
                <span>
                  {filtered.length === 0 ? '0' : `${start + 1}–${Math.min(start + pageSize, filtered.length)}`}
                  {' '}de {filtered.length}
                </span>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded border border-ink/[10%] bg-white hover:bg-ink/[4%] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.5 2L4 6l3.5 4" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded border border-ink/[10%] bg-white hover:bg-ink/[4%] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
