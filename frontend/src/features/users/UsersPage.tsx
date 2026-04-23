import { FormEvent, useEffect, useState } from 'react'
import Topbar from '@/components/Topbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import type { User, UserRole } from '@/types'
import { createUser, getUsers, updateUser } from './services/usersService'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('viewer')
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
      setFormRole('viewer')
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

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) &&
    (!filterRole || u.role === filterRole),
  )

  const roleColor: Record<UserRole, string> = {
    admin: 'bg-red-50 text-red-700',
    maintainer: 'bg-yellow-50 text-yellow-700',
    viewer: 'bg-green-50 text-green-700',
  }

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
            <option value="admin">Admin</option>
            <option value="maintainer">Maintainer</option>
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
                  <option value="viewer">Viewer</option>
                  <option value="maintainer">Maintainer</option>
                  <option value="admin">Admin</option>
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
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-800">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColor[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className="text-xs text-brand-600 hover:text-brand-700 underline"
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </button>
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
