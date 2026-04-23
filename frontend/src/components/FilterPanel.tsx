import { useState } from 'react'

interface Item {
  id: string
  nombre: string
}

interface Props {
  title: string
  items: Item[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  loading?: boolean
}

export default function FilterPanel({ title, items, selectedId, onSelect, loading }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? '' : '-rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 max-h-40 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-2 text-xs text-gray-400">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-2 text-xs text-gray-400">Sin registros</p>
          ) : (
            <>
              {selectedId && (
                <button
                  onClick={() => onSelect(null)}
                  className="w-full text-left px-4 py-1.5 text-xs text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  ✕ Quitar filtro
                </button>
              )}
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id === selectedId ? null : item.id)}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                    item.id === selectedId
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.nombre}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
