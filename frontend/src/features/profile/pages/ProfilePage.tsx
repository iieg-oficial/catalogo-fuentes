import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import Toast from '@/components/Toast'
import apiClient from '@/services/apiClient'

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin:      'bg-orange-100 text-orange-700',
  maintainer: 'bg-yellow-100 text-yellow-700',
  viewer:     'bg-neutral-100 text-neutral-600',
}

function userInitials(correo: string): string {
  const [local] = correo.split('@')
  const parts = local.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase()
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuthContext()

  const [nombre, setNombre] = useState(user?.nombre ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (user?.nombre) setNombre(user.nombre)
  }, [user?.nombre])

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await apiClient.put('/auth/profile', { nombre })
      await refreshUser()
      setToast({ message: 'Perfil actualizado', variant: 'success' })
    } catch {
      setToast({ message: 'No se pudo actualizar el perfil', variant: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setToast({ message: 'La contraseña debe tener al menos 8 caracteres', variant: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Las contraseñas no coinciden', variant: 'error' })
      return
    }
    setSavingPassword(true)
    try {
      await apiClient.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setToast({ message: 'Contraseña actualizada', variant: 'success' })
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setToast({ message: detail ?? 'No se pudo cambiar la contraseña', variant: 'error' })
    } finally {
      setSavingPassword(false)
    }
  }

  const rolNombre = user?.rol?.nombre ?? 'viewer'

  return (
    <div className="flex-1 overflow-auto p-6 bg-neutral-50">
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />}

      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-ink mb-1">Mi perfil</h1>
        <p className="text-xs text-ink/70 mb-6">Administra tu información personal y seguridad.</p>

        {/* Profile card */}
        <div className="bg-white border border-ink/[10%] rounded-xl shadow-sm px-8 py-10 mb-6">
          <div className="flex items-start gap-5 mb-10">
            <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center shrink-0 text-xl font-bold text-white">
              {user?.correo ? userInitials(user.correo) : '?'}
            </div>
            <div>
              <p className="text-xs text-ink/50">Cuenta institucional</p>
              <p className="text-lg font-semibold text-ink mt-0.5">{user?.nombre ?? 'Usuario'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${ROLE_BADGE[rolNombre] ?? 'bg-neutral-100 text-neutral-600'}`}>
                  {rolNombre}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${user?.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user?.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-ink/[12%] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1">Correo institucional</label>
                <input
                  type="email"
                  value={user?.correo ?? ''}
                  disabled
                  className="w-full px-3 py-2.5 text-sm border border-ink/[12%] rounded-lg bg-neutral-50 text-ink/50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {savingProfile ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => setNombre(user?.nombre ?? '')}
                className="px-4 py-2 text-sm font-medium text-ink/60 border border-ink/[12%] rounded-lg hover:bg-ink/[3%] transition-colors"
              >
                Restablecer
              </button>
            </div>
          </form>
        </div>

        {/* Password card */}
        <div className="bg-white border border-ink/[10%] rounded-xl shadow-sm p-8">
          <h2 className="text-sm font-semibold text-ink mb-1">Seguridad</h2>
          <p className="text-xs text-ink/50 mb-5">Actualiza tu contraseña de acceso.</p>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-ink/50 mb-1">Contraseña actual</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-ink/[12%] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Contraseña actual"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-ink/[12%] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/50 mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-ink/[12%] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Repite la nueva contraseña"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {savingPassword ? 'Cambiando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
