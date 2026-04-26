import { FormEvent, useEffect, useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { User, UserRole } from '@/types'
import { createUser, getUsers, updateUser } from './services/usersService'

// ─── Role styling ────────────────────────────────────────────────────────────

const ROLE_AVATAR_BG: Record<UserRole, string> = {
  superadmin: 'bg-purple-600',
  admin:      'bg-orange-500',
  maintainer: 'bg-yellow-500',
  visualizer: 'bg-gray-400',
  viewer:     'bg-gray-400',
}

const ROLE_BADGE: Record<UserRole, string> = {
  superadmin: 'bg-purple-100 text-purple-700 border border-purple-200',
  admin:      'bg-orange-100 text-orange-700 border border-orange-200',
  maintainer: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  visualizer: 'bg-gray-100  text-gray-600   border border-gray-200',
  viewer:     'bg-gray-100  text-gray-600   border border-gray-200',
}

const ROLE_SELECT: Record<UserRole, string> = {
  superadmin: 'border-purple-300 text-purple-700',
  admin:      'border-orange-300 text-orange-700',
  maintainer: 'border-yellow-400 text-yellow-700',
  visualizer: 'border-gray-300  text-gray-600',
  viewer:     'border-gray-300  text-gray-600',
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
        checked ? 'bg-brand-600' : 'bg-gray-300'
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`} />
    </button>
  )
}

function FilterPill({
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
  return (
    <div className="relative inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 shadow-sm">
      <span className="font-medium text-gray-400">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent font-medium text-gray-700 pr-4 focus:outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2 text-gray-400" width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
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

  // Reset to page 1 when filters change
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
    <div className="flex-1 flex flex-col min-h-0 overflow-auto p-6 bg-gray-50">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure enterprise access levels and security policies for all personnel.
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
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 max-w-sm shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Nuevo usuario</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="usuario@iieg.gob.mx"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="visualizer">Visualizer</option>
                <option value="maintainer">Maintainer</option>
                {isSuperAdmin && <option value="admin">Admin</option>}
                {isSuperAdmin && <option value="superadmin">Superadmin</option>}
              </select>
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
          <FilterPill
            label="Role"
            value={filterRole}
            onChange={setFilterRole}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'superadmin', label: 'Superadmin' },
              { value: 'admin', label: 'Admin' },
              { value: 'maintainer', label: 'Maintainer' },
              { value: 'visualizer', label: 'Visualizer' },
            ]}
          />
          <FilterPill
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
        <span className="text-xs text-gray-400">
          Showing {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center"><ErrorState onRetry={load} /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">User Account</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Email Address</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Access Role</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">Last Login</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                  {/* USER ACCOUNT */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar email={user.email} role={user.role} />
                      <div>
                        <p className="font-semibold text-gray-800 leading-tight">{user.email.split('@')[0]}</p>
                        <p className="text-[11px] text-gray-400 leading-tight mt-0.5">ID: {shortId(user.id)}</p>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="px-5 py-3 text-gray-500 text-xs">{user.email}</td>

                  {/* ACCESS ROLE */}
                  <td className="px-5 py-3">
                    {canEditRole(user) ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                        className={`px-2.5 py-1 text-xs border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium ${ROLE_SELECT[user.role]}`}
                      >
                        {allowedRoles().map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                        {user.role}
                      </span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-3">
                    {user.role !== 'superadmin' ? (
                      <div className="flex items-center gap-2">
                        <ToggleSwitch checked={user.is_active} onChange={() => handleToggleActive(user)} />
                        {!user.is_active && (
                          <span className="text-xs font-medium text-red-500">Disabled</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* LAST LOGIN */}
                  <td className="px-5 py-3 text-xs text-gray-400">—</td>

                  {/* ACTIONS */}
                  <td className="px-5 py-3 text-right">
                    <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors" title="Más acciones">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="13" r="1.2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                    No hay usuarios que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-200 rounded px-1.5 py-0.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                {filtered.length === 0 ? '0' : `${start + 1}–${Math.min(start + pageSize, filtered.length)}`}
                {' '}of {filtered.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.5 2L4 6l3.5 4" />
                </svg>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 2L8 6l-3.5 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
