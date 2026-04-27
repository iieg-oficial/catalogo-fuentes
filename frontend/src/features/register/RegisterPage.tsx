import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '@/services/apiClient'
import logoIieg from '@/assets/logo_gris_iieg.png'

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
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
        email,
        password,
        confirm_password: confirmPassword,
      })
      navigate('/login', { replace: true, state: { success: 'Cuenta creada con éxito. Ya puedes iniciar sesión.' } })
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail) {
        setError(detail)
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
              <label htmlFor="email" className="block text-xs font-medium text-neutral-900 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="usuario@iieg.gob.mx"
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
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 bg-brand-600 text-white text-sm font-medium rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span>Registrando…</span>
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </button>
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
