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
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 gap-3">
      <button
        onClick={openSidebar}
        className="md:hidden -ml-1 mr-1 p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
        aria-label="Abrir menú"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      <h2 className="text-base font-semibold text-gray-800 min-w-0 flex-shrink-0">{title}</h2>

      {onSearch !== undefined && (
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Buscar…"
            value={search ?? ''}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Buscar"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      )}
      {filters && <div className="flex items-center gap-2">{filters}</div>}
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  )
}
