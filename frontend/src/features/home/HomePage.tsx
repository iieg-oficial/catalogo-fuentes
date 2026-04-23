import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import { useGlobalSearch } from './useGlobalSearch'

const TYPE_BADGE: Record<string, string> = {
  proyecto:      'bg-brand-100 text-brand-700',
  producto:      'bg-violet-50 text-violet-700',
  tabla:         'bg-sky-50 text-sky-700',
  base_de_datos: 'bg-blue-50 text-blue-700',
  instrumento:   'bg-amber-50 text-amber-700',
  url:           'bg-gray-100 text-gray-600',
  archivo:       'bg-orange-50 text-orange-700',
}

// Subtle background tint per level — maps the hierarchy depth visually
const CARD_TINT: string[] = [
  'hover:bg-brand-50',   // proyectos
  'hover:bg-violet-50',  // productos
  'hover:bg-sky-50',     // tablas
  'hover:bg-blue-50',    // bases de datos
  'hover:bg-amber-50',   // instrumentos
  'hover:bg-gray-50',    // urls
  'hover:bg-orange-50',  // archivos
]

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

  // Global ⌘K / Ctrl+K shortcut
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
    <div className="flex-1 flex flex-col bg-white">
      {/* Page header */}
      <div className="px-8 pt-10 pb-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-600 mb-1.5">
          IIEG Jalisco
        </p>
        <h1
          className="text-3xl font-bold text-gray-900 tracking-tight leading-none"
          style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}
        >
          Catálogo de Datos
        </h1>
        <p className="mt-1.5 text-sm text-gray-400">
          Navega y busca en los activos de información estadística y geográfica
        </p>
        {/* Purple rule */}
        <div className="mt-6 h-px bg-gray-100" />
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">

        {/* Module cards */}
        <section>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-4"
            style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}
          >
            Módulos
          </p>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2.5">
            {CATALOG_LEVELS.map((level, i) => {
              const count = counts[level.key as keyof typeof counts]
              return (
                <button
                  key={level.key}
                  onClick={() => navigate(level.path)}
                  className={`group relative flex flex-col justify-between p-3.5 h-[88px]
                               border border-gray-200 rounded-md bg-white text-left
                               hover:border-brand-600 hover:-translate-y-0.5
                               ${CARD_TINT[i]}
                               transition-all duration-150 focus:outline-none
                               focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1`}
                >
                  <span className="text-[10px] text-gray-300 font-mono tabular-nums leading-none select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div
                      className="text-[11px] font-bold text-gray-600 uppercase tracking-wider leading-tight group-hover:text-brand-700 transition-colors"
                      style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}
                    >
                      {level.label}
                    </div>
                    <div className="mt-1 tabular-nums leading-none">
                      {ready ? (
                        <span className="text-lg font-bold text-accent">
                          {count ?? 0}
                        </span>
                      ) : (
                        <span className="inline-block h-4 w-5 bg-gray-100 rounded animate-pulse" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Search */}
        <section className="max-w-2xl">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-4"
            style={{ fontFamily: '"Red Hat Display", system-ui, sans-serif' }}
          >
            Búsqueda global
          </p>

          <div className="relative">
            {/* Search icon */}
            <svg
              className="absolute left-3.5 top-3 text-gray-400 pointer-events-none"
              width="17" height="17" viewBox="0 0 17 17" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            >
              <circle cx="7.5" cy="7.5" r="5" />
              <path d="M11 11L15 15" />
            </svg>

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                ready
                  ? 'Buscar proyectos, productos, tablas, instrumentos…'
                  : 'Cargando catálogo…'
              }
              disabled={!ready}
              autoComplete="off"
              className="w-full h-11 pl-10 pr-16 text-sm border-2 border-gray-200 rounded-lg
                         bg-white placeholder-gray-400 text-gray-900
                         focus:outline-none focus:border-brand-600
                         disabled:bg-gray-50 disabled:cursor-wait
                         transition-colors duration-150"
            />

            {!hasQuery && (
              <kbd className="absolute right-3 top-2.5 flex items-center gap-0.5 px-1.5 py-0.5
                              text-[10px] text-gray-400 border border-gray-200 rounded font-mono bg-white">
                ⌘K
              </kbd>
            )}

            {hasQuery && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3.5 3.5l8 8M11.5 3.5l-8 8" />
                </svg>
              </button>
            )}
          </div>

          {/* Results panel */}
          {hasQuery && (
            <div className="mt-1.5 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
              {results.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-gray-500">
                    Sin resultados para <span className="font-medium text-gray-700">"{query}"</span>
                  </p>
                  {ready && (
                    <p className="text-xs text-gray-400 mt-1">
                      Intenta con otro término o revisa la ortografía
                    </p>
                  )}
                </div>
              ) : (
                results.map((result, i) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => navigate(result.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                                border-b border-gray-100 last:border-0
                                transition-colors duration-75
                                ${i === selected ? 'bg-brand-50' : 'hover:bg-gray-50'}`}
                  >
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded
                                   uppercase tracking-wide whitespace-nowrap
                                   ${TYPE_BADGE[result.type] ?? 'bg-gray-100 text-gray-600'}`}
                    >
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
                    <svg
                      className="shrink-0 text-gray-300"
                      width="12" height="12" viewBox="0 0 12 12" fill="none"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M2.5 6h7M7 3.5L9.5 6 7 8.5" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          )}

          {hasQuery && results.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              {results.length} resultado{results.length !== 1 ? 's' : ''} — usa ↑↓ para navegar, Enter para abrir, Esc para cerrar
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
