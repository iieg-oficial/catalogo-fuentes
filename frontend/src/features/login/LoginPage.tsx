import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import logoIieg from '@/assets/logo_gris_iieg.png'

const STORAGE_KEY = 'login_remembered'

function loadRemembered(): { email: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

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

export default function LoginPage() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as { success?: string } | null)?.success ?? ''
  const [email, setEmail] = useState(() => loadRemembered()?.email ?? '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => !!loadRemembered())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
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
              Sistema de Gestión de Proyectos
            </p>
          </div>

          {successMessage && (
            <p className="mb-4 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              {successMessage}
            </p>
          )}

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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-medium text-neutral-900">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecovery((v) => !v)}
                  className="text-xs text-brand-600 hover:text-brand-700 hover:underline focus:outline-none"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <div aria-live="polite">
                {showRecovery && (
                  <p className="mt-2 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2">
                    Contacta al administrador para restablecer tu contraseña:{' '}
                    <a href="mailto:admin@iieg.gob.mx" className="text-brand-600 hover:underline">
                      admin@iieg.gob.mx
                    </a>
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs text-error-600 bg-error-50 border border-error-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="pt-1 space-y-3">
              <label className="flex items-center gap-2 py-1 cursor-pointer select-none">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-200 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-neutral-500">Recordar mi usuario en este navegador</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 bg-brand-600 text-white text-sm font-medium rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span>Ingresando…</span>
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </div>
          </form>
        </main>

        <p className="text-center text-xs text-neutral-500">
          ¿Primera vez?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Crea tu contraseña
          </Link>
        </p>
      </div>
    </div>
  )
}
