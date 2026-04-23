import { useState, type ReactNode } from 'react'

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  caption?: string
  onRowClick?: (row: T) => void
  getKey: (row: T) => string
  // Inline add row
  onAdd?: () => void
  addRowCells?: ReactNode     // <td>s for static columns (same count as columns[])
  addRowActions?: ReactNode   // save/cancel shown in actions column
  // Meta columns
  metaColumns?: string[]
  getMeta?: (row: T) => Record<string, unknown>
  onAddColumn?: () => void
  onDeleteColumn?: (key: string) => void
  onEditMetaCell?: (row: T, key: string, value: string) => void
  // Row deletion
  onDeleteRow?: (row: T) => void
}

export default function DataTable<T>({
  columns,
  rows,
  caption,
  onRowClick,
  getKey,
  onAdd,
  addRowCells,
  addRowActions,
  metaColumns,
  getMeta,
  onAddColumn,
  onDeleteColumn,
  onEditMetaCell,
  onDeleteRow,
}: DataTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowKey: string; colKey: string; value: string } | null>(null)
  const hasActionsCol = !!onDeleteRow

  const totalCols =
    columns.length +
    (metaColumns?.length ?? 0) +
    (onAddColumn ? 1 : 0) +
    (hasActionsCol ? 1 : 0)

  return (
    <div className="w-full overflow-x-auto rounded border border-gray-200">
      <table className="min-w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-gray-800 text-gray-100 text-left text-xs uppercase tracking-wider">
            {columns.map((col, i) => (
              <th key={i} className={`px-3 py-2 font-semibold whitespace-nowrap ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
            {metaColumns?.map((key) => (
              <th key={key} className="group px-3 py-2 font-semibold whitespace-nowrap italic text-gray-300">
                <span className="inline-flex items-center gap-1">
                  {key}
                  {onDeleteColumn && (
                    <button
                      onClick={() => onDeleteColumn(key)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 leading-none text-sm"
                      title="Quitar columna"
                      aria-label={`Quitar columna ${key}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              </th>
            ))}
            {onAddColumn && (
              <th className="px-3 py-2 w-10 text-center">
                <button
                  onClick={onAddColumn}
                  className="text-gray-400 hover:text-white font-bold text-base leading-none"
                  title="Agregar campo"
                  aria-label="Agregar campo"
                >
                  +
                </button>
              </th>
            )}
            {hasActionsCol && <th className="w-8" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && !addRowCells && !onAdd && (
            <tr>
              <td colSpan={totalCols} className="px-3 py-4 text-sm text-gray-400 text-center">
                Sin registros.
              </td>
            </tr>
          )}
          {rows.map((row, ri) => (
            <tr
              key={getKey(row)}
              onClick={() => onRowClick?.(row)}
              onKeyDown={onRowClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRowClick(row)
                }
              } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={`group ${onRowClick ? 'cursor-pointer hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500' : ''} ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            >
              {columns.map((col, ci) => (
                <td key={ci} className={`px-3 py-2 align-top ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}
              {metaColumns?.map((key) => {
                const isEditing = editingCell?.rowKey === getKey(row) && editingCell?.colKey === key
                const currentVal = String(getMeta?.(row)?.[key] ?? '')
                return (
                  <td
                    key={key}
                    className="px-3 py-2 align-top text-xs text-gray-500"
                    onClick={(e) => {
                      if (onEditMetaCell) {
                        e.stopPropagation()
                        setEditingCell({ rowKey: getKey(row), colKey: key, value: currentVal === '—' ? '' : currentVal })
                      }
                    }}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingCell!.value}
                        onChange={(e) => setEditingCell((prev) => prev ? { ...prev, value: e.target.value } : null)}
                        onBlur={() => {
                          onEditMetaCell?.(row, key, editingCell!.value)
                          setEditingCell(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { onEditMetaCell?.(row, key, editingCell!.value); setEditingCell(null) }
                          if (e.key === 'Escape') setEditingCell(null)
                        }}
                        className="w-full px-1 py-0.5 text-xs border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className={onEditMetaCell ? 'cursor-text hover:bg-brand-50 rounded px-0.5' : ''}>
                        {currentVal || '—'}
                      </span>
                    )}
                  </td>
                )
              })}
              {onAddColumn && <td />}
              {hasActionsCol && (
                <td className="px-2 py-2 w-8 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDeleteRow?.(row)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 text-base leading-none transition-opacity"
                    title="Eliminar"
                    aria-label="Eliminar fila"
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}

          {/* Inline add row */}
          {addRowCells && (
            <tr className="bg-brand-50 border-t-2 border-brand-200">
              {addRowCells}
              {metaColumns?.map((k) => <td key={k} className="px-3 py-1.5" />)}
              {onAddColumn && <td />}
              {hasActionsCol && (
                <td className="px-2 py-1.5 text-center whitespace-nowrap">
                  {addRowActions}
                </td>
              )}
            </tr>
          )}

          {/* + Agregar row */}
          {!addRowCells && onAdd && (
            <tr className="bg-white border-t border-gray-200 hover:bg-gray-50">
              <td colSpan={totalCols} className="px-3 py-2">
                <button onClick={onAdd} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                  + Agregar
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
