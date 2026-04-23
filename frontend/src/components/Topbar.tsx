import type { ReactNode } from 'react'

interface Props {
  title: string
  search?: string
  onSearch?: (value: string) => void
  filters?: ReactNode
  actions?: ReactNode
}

export default function Topbar({ title, search, onSearch, filters, actions }: Props) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-3">
      <h2 className="text-base font-semibold text-gray-800 min-w-0 flex-shrink-0">{title}</h2>
      {onSearch !== undefined && (
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Buscar…"
            value={search ?? ''}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      )}
      {filters && <div className="flex items-center gap-2">{filters}</div>}
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  )
}
