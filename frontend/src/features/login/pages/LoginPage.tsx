import { FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'

const INPUT_CLASS =
  'w-full h-10 px-3 text-[13px] font-medium rounded-lg border border-transparent bg-[#F8F8F8] text-brand-600 placeholder:text-[#8E8E8E] placeholder:font-normal outline-none transition-all hover:border-brand-400 hover:shadow-[0_2px_16px_rgba(46,67,114,0.12)] focus:bg-white focus:border-brand-600 focus:shadow-[0_0_0_1px_#2e4372]'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-6"
      style={{ background: 'url(/login-background.svg) center / cover no-repeat' }}
    >
      {/* Main card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Form side */}
          <div className="flex items-center justify-center px-10 py-14 md:px-14">
            <div className="w-full max-w-[280px]">
              <div className="mb-8">
                <h1 className="text-[22px] font-bold leading-tight text-brand-600 mb-1">Hola</h1>
                <p className="text-xs text-[#1f2937]">Ingresa tus datos para iniciar sesión.</p>
              </div>

              {successMessage && (
                <p className="mb-4 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  {successMessage}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-[#191919] mb-1.5">
                    Correo electrónico <span className="text-accent font-bold">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="correo@iieg.gob.mx"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-[#191919] mb-1.5">
                    Contraseña <span className="text-accent font-bold">*</span>
                  </label>
                  <div className="group relative flex items-center h-10 rounded-lg border border-transparent bg-[#F8F8F8] transition-all hover:border-brand-400 hover:shadow-[0_2px_16px_rgba(46,67,114,0.12)] focus-within:bg-white focus-within:border-brand-600 focus-within:shadow-[0_0_0_1px_#2e4372]">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-full px-3 pr-10 text-[13px] font-medium text-brand-600 placeholder:text-[#8E8E8E] placeholder:font-normal bg-transparent border-none outline-none"
                      placeholder="Contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <img
                        src={showPassword ? '/ico-show.svg' : '/ico-hidden.svg'}
                        alt={showPassword ? 'Mostrar' : 'Ocultar'}
                        className="w-[22px] h-[22px]"
                      />
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-xs text-error-600 bg-error-50 border border-error-200 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 h-11 bg-brand-600 text-white text-sm font-bold rounded-full hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? <><Spinner /> Ingresando…</> : 'Iniciar sesión'}
                </button>
              </form>

            </div>
          </div>

          {/* Branding side */}
          <div className="hidden md:flex items-center justify-center p-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-5 mb-7">
                <img src="/iieg-favicon-192.png" alt="" aria-hidden="true" className="h-20 w-auto" />
                <div className="w-0.5 h-14 bg-accent" aria-hidden="true" />
                <span className="text-5xl font-extrabold text-neutral-500 leading-none">STF</span>
              </div>
              <p className="text-base font-semibold text-neutral-500 leading-snug max-w-[300px] mx-auto">
                Sistema de trackeo de fuentes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-5 mt-10">
        <img src="/jalisco-logo.svg" alt="Gobierno de Jalisco" className="h-12 w-auto" />
        <a
          href="https://iieg.gob.mx/ns/wp-content/uploads/2025/06/Aviso_de_Privacidad_Integral_IIEG_06_2025.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-white font-bold underline"
        >
          Aviso de privacidad
        </a>
      </div>
    </div>
  )
}
