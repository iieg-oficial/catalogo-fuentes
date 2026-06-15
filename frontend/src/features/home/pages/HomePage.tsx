import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATALOG_LEVELS } from '@/consts'
import { useGlobalSearch } from './useGlobalSearch'

const TYPE_BADGE: Record<string, string> = {
  proyecto:           'bg-brand-100 text-brand-700',
  producto:           'bg-violet-50 text-violet-700',
  fuente:             'bg-teal-50 text-teal-700',
  dataset:            'bg-sky-50 text-sky-700',
  edicion_dataset:    'bg-blue-50 text-blue-700',
  distribucion:       'bg-emerald-50 text-emerald-700',
  base_de_datos:      'bg-indigo-50 text-indigo-700',
  informacion_tablas: 'bg-cyan-50 text-cyan-700',
  archivo:            'bg-rose-50 text-rose-700',
}

const HOME_CARD_BG = '#f5f9ff'

const MODULE_COLOR: Record<string, string> = {
  proyectos:            '#5C2472',
  productos:            '#7c3aed',
  'informacion-tablas': '#1d4ed8',
  'bases-de-datos':     '#ea580c',
  datasets:             '#0f766e',
  fuentes:              '#b45309',
  'ediciones-dataset':  '#047857',
  distribuciones:       '#0891b2',
  archivos:             '#be123c',
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  proyectos: (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 5.5C1.5 4.67 2.17 4 3 4H5.8l1.4 1.5H13c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5H3C2.17 13.5 1.5 12.83 1.5 12V5.5Z" />
    </svg>
  ),
  productos: (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L14.5 5v6L8 14.5 1.5 11V5L8 1.5Z" />
      <path d="M1.5 5L8 8.5l6.5-3.5M8 8.5V14.5" />
    </svg>
  ),
  fuentes: (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1.5h5.5l3 3V13.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" />
      <path d="M9.5 1.5v3.5h3" />
      <path d="M6 8h4M6 10.5h2.5" />
    </svg>
  ),
  datasets: (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  'ediciones-dataset': (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 1.5l3 3-8.5 8.5H3v-3l8.5-8.5z" />
      <path d="M9.5 3.5l3 3" />
    </svg>
  ),
  distribuciones: (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 9.5a4 4 0 005.5.5l1.5-1.5a4 4 0 00-5.5-5.5L7 4" />
      <path d="M9.5 6.5A4 4 0 004 6L2.5 7.5A4 4 0 008 13l1-1" />
    </svg>
  ),
  'bases-de-datos': (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="5" rx="5.5" ry="2" />
      <path d="M2.5 5v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V5" />
      <path d="M2.5 8v3c0 1.1 2.46 2 5.5 2s5.5-.9 5.5-2V8" />
    </svg>
  ),
  'informacion-tablas': (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" />
      <path d="M1.5 6.5h13M6.5 1.5v13" />
      <circle cx="11" cy="4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  archivos: (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1.5h5.5l3 3V13.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z" />
      <path d="M9.5 1.5v3.5h3M8 8v4M6 10l2 2 2-2" />
    </svg>
  ),
}

const VIEW_KEY = 'home_modules_view'

export default function HomePage() {
  const navigate = useNavigate()
  const { search, counts, ready } = useGlobalSearch()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [view, setView] = useState<'grid' | 'list'>(
    () => (localStorage.getItem(VIEW_KEY) as 'grid' | 'list') ?? 'grid',
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => search(query), [search, query])

  const totalRegistros = useMemo(
    () => CATALOG_LEVELS.reduce((sum, l) => sum + (counts[l.key as keyof typeof counts] ?? 0), 0),
    [counts],
  )

  const setViewMode = (v: 'grid' | 'list') => {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

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
    <div className="flex-1 flex flex-col bg-white overflow-y-auto scrollbar-hide">
      <div className="px-8 pt-10 pb-12 flex flex-col gap-8">

        {/* Header — title */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
            Catálogo de Datos
          </h1>
        </div>

        {/* Toolbar — search + view toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-[28rem]">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              width="15" height="15" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.5 10.5L14 14" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ready ? 'Busca en proyectos, productos, datasets, etc.' : 'Cargando catálogo…'}
              disabled={!ready}
              autoComplete="off"
              className="w-full h-11 pl-10 pr-11 text-sm border border-gray-200 rounded-xl
                         bg-white placeholder-gray-400 text-gray-900
                         focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500
                         disabled:bg-gray-50 disabled:cursor-wait transition-all duration-150"
            />
            {!hasQuery ? (
              <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center px-1.5 py-0.5
                              text-[11px] text-gray-400 border border-gray-200 rounded font-mono bg-white">
                ⌘K
              </kbd>
            ) : (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3L3 11" />
                </svg>
              </button>
            )}

            {/* Search results dropdown */}
            {hasQuery && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50">
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-lg">
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
                {results.length > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="text-xs font-medium text-neutral-400">
                      {results.length} resultado{results.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-neutral-200 text-xs">·</span>
                    <span className="text-[11px] text-neutral-300 flex items-center gap-1.5">
                      <kbd className="px-1 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono text-[10px] text-neutral-400">↑↓</kbd>
                      navegar
                      <kbd className="px-1 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono text-[10px] text-neutral-400">↵</kbd>
                      abrir
                      <kbd className="px-1 py-0.5 rounded bg-neutral-100 border border-neutral-200 font-mono text-[10px] text-neutral-400">Esc</kbd>
                      cerrar
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shrink-0 sm:ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              aria-pressed={view === 'grid'}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                view === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
                <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
                <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
                <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-pressed={view === 'list'}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                view === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1.5 4h13M1.5 8h13M1.5 12h13" />
              </svg>
              Lista
            </button>
          </div>
        </div>

        {/* Modules */}
        <section>
          <p className="text-[11px] text-gray-400 mb-4">
            <span className="font-semibold uppercase tracking-[0.14em] text-gray-500">Módulos del catálogo</span>
            <span className="mx-1.5 text-gray-300">—</span>
            {ready ? totalRegistros.toLocaleString('es-MX') : '…'} registros
          </p>

          {view === 'grid' ? (
            <div key="grid" className="view-enter grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATALOG_LEVELS.map((level) => {
                const count = counts[level.key as keyof typeof counts]
                const color = MODULE_COLOR[level.key] ?? '#6b7280'
                return (
                  <button
                    key={level.key}
                    onClick={() => navigate(level.path)}
                    aria-label={level.label}
                    className="group flex flex-col overflow-hidden aspect-square rounded-[10px] border border-ink/[8%] bg-white
                               shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 text-left"
                  >
                    <div
                      className="flex flex-1 items-center justify-center [&>svg]:w-12 [&>svg]:h-12"
                      style={{ color, backgroundColor: HOME_CARD_BG }}
                    >
                      {MODULE_ICONS[level.key]}
                    </div>
                    <div className="flex flex-col gap-1 px-4 py-3 border-t border-ink/[6%]">
                      <span className="text-[13px] font-semibold text-gray-800 leading-tight">
                        {level.label}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="tabular-nums text-2xl font-bold text-gray-900 leading-none">
                          {ready ? (count ?? 0) : '…'}
                        </span>
                        <span className="text-[11px] text-gray-400">registros</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div key="list" className="view-enter flex flex-col gap-2">
              {CATALOG_LEVELS.map((level) => {
                const count = counts[level.key as keyof typeof counts]
                const color = MODULE_COLOR[level.key] ?? '#6b7280'
                return (
                  <button
                    key={level.key}
                    onClick={() => navigate(level.path)}
                    aria-label={level.label}
                    className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-ink/[8%] bg-white
                               shadow-sm hover:border-brand-300 hover:shadow-md transition-all duration-150
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 text-left"
                  >
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-lg shrink-0"
                      style={{ color, backgroundColor: HOME_CARD_BG }}
                    >
                      {MODULE_ICONS[level.key]}
                    </div>
                    <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
                      {level.label}
                    </span>
                    <div className="flex items-baseline gap-1.5 shrink-0">
                      <span className="tabular-nums text-xl font-bold text-gray-900 leading-none">
                        {ready ? (count ?? 0) : '…'}
                      </span>
                      <span className="text-[11px] text-gray-400">registros</span>
                    </div>
                    <svg className="shrink-0 text-gray-300 group-hover:text-brand-500 transition-colors" width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6h7M7 3.5L9.5 6 7 8.5" />
                    </svg>
                  </button>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
