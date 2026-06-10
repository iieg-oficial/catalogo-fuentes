import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '@/services/apiClient'
import Button from '@/components/Button'
import logoIieg from '@/assets/logo_gris_iieg.png'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/signup', {
        correo,
        nombre,
        password,
        confirm_password: confirmPassword,
      })
      navigate('/login', { replace: true, state: { success: 'Cuenta creada con éxito. Ya puedes iniciar sesión.' } })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
      const detail = data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: { msg?: string }) => d.msg ?? '').filter(Boolean).join('. ') || 'Datos inválidos.')
      } else {
        setError('Ocurrió un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <main className="bg-white rounded-xl shadow-sm border border-neutral-200 border-t-4 border-t-brand-600 p-8">
          <div className="mb-8">
            <img src={logoIieg} alt="IIEG Jalisco" width={173} height={64} className="h-16 w-auto mb-3" />
            <p className="text-xs font-medium text-brand-600 uppercase tracking-widest">
              Crear contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="correo" className="block text-xs font-medium text-neutral-900 mb-1">
                Correo electrónico
              </label>
              <input
                id="correo"
                type="email"
                required
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="usuario@iieg.gob.mx"
              />
            </div>

            <div>
              <label htmlFor="nombre" className="block text-xs font-medium text-neutral-900 mb-1">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                required
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Nombre"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-900 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-medium text-neutral-900 mb-1">
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Repite la contraseña"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-error-600 bg-error-50 border border-error-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="pt-1">
              <Button type="submit" size="lg" fullWidth loading={loading}>
                {loading ? 'Registrando…' : 'Crear cuenta'}
              </Button>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-neutral-500">
            ¿Ya tienes contraseña?{' '}
            <Link to="/login" className="text-brand-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </main>

        <p className="text-center text-xs text-neutral-500">
          Si tu correo no está registrado, contacta al administrador.
        </p>
      </div>
    </div>
  )
}
