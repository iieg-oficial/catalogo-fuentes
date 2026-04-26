import { FormEvent, useEffect, useState } from 'react'
import Topbar from '@/components/Topbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { User, UserRole } from '@/types'
import { createUser, getUsers, updateUser } from './services/usersService'

const ROLE_COLOR: Record<UserRole, string> = {
  superadmin: 'bg-purple-50 text-purple-700',
  admin: 'bg-red-50 text-red-700',
  maintainer: 'bg-yellow-50 text-yellow-700',
  visualizer: 'bg-green-50 text-green-700',
  viewer: 'bg-green-50 text-green-700',
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
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuthContext()
  const isAdmin = currentUser?.role === 'admin'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('visualizer')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      setUsers(await getUsers())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const u = await createUser(formEmail, formPassword, formRole)
      setUsers((prev) => [...prev, u])
      setShowForm(false)
      setFormEmail('')
      setFormPassword('')
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
    } catch {
      alert('Error al actualizar el usuario.')
    }
  }

  const handleChangeRole = async (user: User, role: UserRole) => {
    try {
      const updated = await updateUser(user.id, { role })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch {
      alert('Error al cambiar el rol.')
    }
  }

  // Whether the current user can edit the role of a given user
  const canEditRole = (target: User): boolean => {
    if (target.role === 'superadmin') return false
    if (isSuperAdmin) return true
    if (isAdmin) return target.role !== 'admin'
    return false
  }

  // Roles the current user is allowed to assign
  const allowedRoles = (): UserRole[] => {
    if (isSuperAdmin) return ['admin', 'maintainer', 'visualizer']
    if (isAdmin) return ['maintainer', 'visualizer']
    return []
  }

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) &&
    (!filterRole || u.role === filterRole),
  )

  return (
    <>
      <Topbar
        title="Usuarios"
        search={search}
        onSearch={setSearch}
        filters={
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white text-gray-700"
          >
            <option value="">Todos los roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="maintainer">Maintainer</option>
            <option value="visualizer">Visualizer</option>
            <option value="viewer">Viewer</option>
          </select>
        }
      />
      <div className="flex-1 p-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-md hover:bg-brand-700 transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Nuevo usuario'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-gray-200 rounded-lg p-5 mb-6 max-w-md"
          >
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Crear usuario</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full py-2 bg-brand-600 text-white text-sm rounded-md hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {formLoading ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState onRetry={load} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Rol</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Activo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-800">{user.email}</td>
                    <td className="px-4 py-3">
                      {canEditRole(user) ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                          className="px-2 py-0.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          {allowedRoles().map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[user.role]}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'superadmin' ? (
                        <ToggleSwitch
                          checked={user.is_active}
                          onChange={() => handleToggleActive(user)}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
