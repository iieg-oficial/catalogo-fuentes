import type { ReactNode } from 'react'
import { useSidebar } from '@/context/SidebarContext'

interface Props {
  title: string
  search?: string
  onSearch?: (value: string) => void
  filters?: ReactNode
  actions?: ReactNode
}

export default function Topbar({ title, search, onSearch, filters, actions }: Props) {
  const { openSidebar } = useSidebar()

  return (
    <header className="h-14 bg-white border-b border-neutral-100 flex items-center px-4 md:px-6 gap-4 shrink-0">
      <button
        onClick={openSidebar}
        className="md:hidden -ml-1 mr-1 p-1.5 rounded-md text-neutral-400 hover:text-neutral-700
                   hover:bg-neutral-100 transition-colors duration-150 shrink-0
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Abrir menú"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      <h2
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 shrink-0"
      >
        {title}
      </h2>

      {onSearch !== undefined && (
        <div className="relative max-w-xs w-full">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none"
            width="13" height="13" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            type="text"
            placeholder="Buscar…"
            value={search ?? ''}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Buscar"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg
                       focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20
                       placeholder-neutral-300 text-neutral-700 transition-colors duration-150 bg-white"
          />
        </div>
      )}

      {filters && <div className="flex items-center gap-2">{filters}</div>}
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  )
}
