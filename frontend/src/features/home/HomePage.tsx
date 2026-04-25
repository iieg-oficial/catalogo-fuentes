import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import { useGlobalSearch } from './useGlobalSearch'

const TYPE_BADGE: Record<string, string> = {
  proyecto:      'bg-brand-100 text-brand-700',
  producto:      'bg-violet-50 text-violet-700',
  tabla:         'bg-sky-50 text-sky-700',
  base_de_datos: 'bg-blue-50 text-blue-700',
  instrumento:   'bg-emerald-50 text-emerald-700',
  url:           'bg-orange-50 text-orange-700',
  archivo:       'bg-rose-50 text-rose-700',
}

const CARD_BG: Record<string, string> = {
  proyectos:        'bg-brand-600',
  productos:        'bg-violet-600',
  tablas:           'bg-blue-700',
  'bases-de-datos': 'bg-teal-700',
  instrumentos:     'bg-emerald-700',
  urls:             'bg-orange-600',
  archivos:         'bg-rose-700',
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  proyectos: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 5.5C1.5 4.67 2.17 4 3 4H5.8l1.4 1.5H13c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5H3C2.17 13.5 1.5 12.83 1.5 12V5.5Z" />
    </svg>
  ),
  productos: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L14.5 5v6L8 14.5 1.5 11V5L8 1.5Z" />
      <path d="M1.5 5L8 8.5l6.5-3.5M8 8.5V14.5" />
    </svg>
  ),
  tablas: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" />
      <path d="M1.5 6.5h13M1.5 11h13M6.5 1.5v13" />
    </svg>
  ),
  'bases-de-datos': (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <ellipse cx="8" cy="5" rx="5.5" ry="2" />
      <path d="M2.5 5v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V5" />
      <path d="M2.5 8v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V8" />
    </svg>
  ),
  instrumentos: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1.5" width="8" height="13" rx="1" />
      <path d="M6.5 1.5v2h3v-2M6 7h4M6 10h2.5" />
    </svg>
  ),
  urls: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6.5 9.5a4 4 0 005.5.5l1.5-1.5a4 4 0 00-5.5-5.5L7 4" />
      <path d="M9.5 6.5A4 4 0 004 6L2.5 7.5A4 4 0 008 13l1-1" />
    </svg>
  ),
  archivos: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1.5h5.5l3 3V13.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" />
      <path d="M9.5 1.5v3.5h3M8 8v4M6 10l2 2 2-2" />
    </svg>
  ),
}

export default function HomePage() {
  const navigate = useNavigate()
  const { search, counts, ready } = useGlobalSearch()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => search(query), [search, query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[selected]) navigate(results[selected].path)
    } else if (e.key === 'Escape') {
      setQuery('')
      inputRef.current?.blur()
    }
  }, [results, selected, navigate])

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const hasQuery = query.trim().length > 0

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="px-8 pt-10 pb-12 flex flex-col gap-10">

        {/* Header — logo + title */}
        <div className="flex items-center gap-4">
          <img
            src="/logo_gris_iieg.png"
            alt="IIEG Jalisco"
            className="h-10 shrink-0"
          />
          <div className="h-10 w-px bg-gray-200 shrink-0" />
          <div>
            <h1
              className="text-2xl font-bold text-gray-900 tracking-tight leading-tight"
              style={{ fontFamily: '"Garet", system-ui, sans-serif' }}
            >
              Catálogo de Datos
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Navega y busca en los activos de información estadística y geográfica
            </p>
          </div>
        </div>

        {/* Module cards */}
        <section>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-4"
            style={{ fontFamily: '"Garet", system-ui, sans-serif' }}
          >
            Módulos del catálogo
          </p>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {CATALOG_LEVELS.map((level) => {
              const count = counts[level.key as keyof typeof counts]
              const bg = CARD_BG[level.key] ?? 'bg-gray-600'
              return (
                <button
                  key={level.key}
                  onClick={() => navigate(level.path)}
                  aria-label={level.label}
                  className={`group flex flex-col items-center justify-center gap-3
                               p-5 h-[156px] rounded-xl text-white text-center
                               ${bg} hover:opacity-90 hover:-translate-y-1 hover:shadow-lg
                               shadow-sm transition duration-150 focus:outline-none
                               focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2`}
                >
                  {/* Icon bubble */}
                  <div className="p-2.5 rounded-xl bg-white/20">
                    {MODULE_ICONS[level.key]}
                  </div>

                  {/* Label + count */}
                  <div>
                    <div
                      className="text-xs font-bold uppercase tracking-wide text-white/80 leading-tight"
                      style={{ fontFamily: '"Garet", system-ui, sans-serif' }}
                    >
                      {level.label}
                    </div>
                    <div className="mt-1 tabular-nums leading-none">
                      {ready ? (
                        <span className="text-3xl font-bold text-white">
                          {count ?? 0}
                        </span>
                      ) : (
                        <span className="inline-block h-7 w-12 bg-white/20 rounded animate-pulse" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Search — below cards, centered */}
        <section className="flex flex-col items-center">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-4"
            style={{ fontFamily: '"Garet", system-ui, sans-serif' }}
          >
            Búsqueda global
          </p>

          <div className="relative w-full max-w-3xl">
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              width="22" height="22" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5L14 14" />
            </svg>

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ready ? 'Buscar proyectos, productos, tablas, instrumentos…' : 'Cargando catálogo…'}
              disabled={!ready}
              autoComplete="off"
              className="w-full h-16 pl-14 pr-20 text-lg border-2 border-gray-200 rounded-2xl
                         bg-white placeholder-gray-400 text-gray-900
                         focus:outline-none focus:border-brand-600 focus:shadow-md
                         disabled:bg-gray-50 disabled:cursor-wait
                         shadow-sm transition-all duration-150"
            />

            {!hasQuery && (
              <kbd className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center px-2 py-1
                              text-xs text-gray-400 border border-gray-200 rounded font-mono bg-white">
                ⌘K
              </kbd>
            )}

            {hasQuery && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3L3 11" />
                </svg>
              </button>
            )}
          </div>

          {hasQuery && (
            <div className="mt-1 w-full max-w-3xl border-2 border-gray-200 rounded-2xl bg-white overflow-hidden shadow-md">
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">
                    Sin resultados para <span className="font-medium text-gray-700">"{query}"</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Intenta con otro término o revisa la ortografía
                  </p>
                </div>
              ) : (
                results.map((result, i) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => navigate(result.path)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left
                                border-b border-gray-100 last:border-0 transition-colors duration-75
                                ${i === selected ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide whitespace-nowrap ${TYPE_BADGE[result.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {result.typeLabel}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">
                      {result.label}
                    </span>
                    {result.subtitle && (
                      <span className="shrink-0 text-xs text-gray-400 truncate max-w-[200px] hidden sm:block">
                        {result.subtitle}
                      </span>
                    )}
                    <svg className="shrink-0 text-gray-300" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6h7M7 3.5L9.5 6 7 8.5" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          )}

          {hasQuery && results.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              {results.length} resultado{results.length !== 1 ? 's' : ''} — ↑↓ navegar · Enter abrir · Esc cerrar
            </p>
          )}
        </section>

      </div>
    </div>
  )
}
