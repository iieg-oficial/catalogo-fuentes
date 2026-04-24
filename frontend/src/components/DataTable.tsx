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
  addRowCells?: ReactNode
  addRowActions?: ReactNode
  // Meta columns
  metaColumns?: string[]
  getMeta?: (row: T) => Record<string, unknown>
  onAddColumn?: () => void
  onDeleteColumn?: (key: string) => void
  onEditMetaCell?: (row: T, key: string, value: string) => void
  // Meta inputs for add row (controlled by parent)
  addRowMetaValues?: Record<string, string>
  onAddRowMetaChange?: (key: string, value: string) => void
  // Row deletion
  onDeleteRow?: (row: T) => void
}

const thBase = 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap'
const tdBase = 'px-4 py-2.5 align-top'

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
  addRowMetaValues,
  onAddRowMetaChange,
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
    <div className="w-full overflow-x-auto rounded-lg border border-neutral-200 shadow-sm">
      <table className="min-w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr className="bg-white border-b border-neutral-100 text-left">
            {columns.map((col, i) => (
              <th key={i} className={`${thBase} text-neutral-400 ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
            {metaColumns?.map((key) => (
              <th key={key} className={`group ${thBase} text-neutral-300`}>
                <span className="inline-flex items-center gap-1">
                  {key}
                  {onDeleteColumn && (
                    <button
                      onClick={() => onDeleteColumn(key)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400
                                 transition-opacity duration-150 leading-none"
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
              <th className="px-3 py-3 w-10 text-center">
                <button
                  onClick={onAddColumn}
                  className="text-neutral-300 hover:text-brand-600 transition-colors duration-150"
                  title="Agregar campo"
                  aria-label="Agregar campo"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M7 1v12M1 7h12" />
                  </svg>
                </button>
              </th>
            )}
            {hasActionsCol && <th className="w-8" />}
          </tr>
        </thead>

        <tbody className="divide-y divide-neutral-100">
          {rows.length === 0 && !addRowCells && !onAdd && (
            <tr>
              <td colSpan={totalCols} className="px-6 py-12 text-center">
                <p className="text-sm text-neutral-400">Sin registros</p>
              </td>
            </tr>
          )}

          {rows.length === 0 && !addRowCells && onAdd && (
            <tr>
              <td colSpan={totalCols} className="px-6 py-10 text-center">
                <p className="text-sm text-neutral-400">Sin registros</p>
                <p className="text-xs text-neutral-300 mt-1">Presiona "+ Agregar" para añadir el primero</p>
              </td>
            </tr>
          )}

          {rows.map((row) => (
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
              className={`group bg-white ${
                onRowClick
                  ? 'cursor-pointer hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500'
                  : ''
              }`}
            >
              {columns.map((col, ci) => (
                <td key={ci} className={`${tdBase} ${col.className ?? ''}`}>
                  {col.render(row)}
                </td>
              ))}

              {metaColumns?.map((key) => {
                const isEditing = editingCell?.rowKey === getKey(row) && editingCell?.colKey === key
                const currentVal = String(getMeta?.(row)?.[key] ?? '')
                return (
                  <td
                    key={key}
                    className={`${tdBase} text-xs text-neutral-400`}
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
                        className="w-full px-1.5 py-0.5 text-xs border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className={onEditMetaCell ? 'cursor-text hover:bg-brand-50 rounded px-0.5 transition-colors duration-100' : ''}>
                        {currentVal || '—'}
                      </span>
                    )}
                  </td>
                )
              })}

              {onAddColumn && <td />}

              {hasActionsCol && (
                <td className="px-3 py-2.5 w-8 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onDeleteRow?.(row)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500
                               transition-all duration-150"
                    title="Eliminar"
                    aria-label="Eliminar fila"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4" />
                    </svg>
                  </button>
                </td>
              )}
            </tr>
          ))}

          {/* Inline add row */}
          {addRowCells && (
            <tr className="bg-brand-50/60 border-t border-brand-100">
              {addRowCells}
              {metaColumns?.map((k) => (
                <td key={k} className="px-4 py-2">
                  {onAddRowMetaChange && (
                    <input
                      value={addRowMetaValues?.[k] ?? ''}
                      onChange={(e) => onAddRowMetaChange(k, e.target.value)}
                      placeholder={k + '…'}
                      className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md
                                 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400
                                 bg-white placeholder-neutral-300 transition-colors duration-150"
                    />
                  )}
                </td>
              ))}
              {onAddColumn && <td />}
              {hasActionsCol && (
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  {addRowActions}
                </td>
              )}
            </tr>
          )}

          {/* + Agregar row */}
          {!addRowCells && onAdd && (
            <tr className="bg-white hover:bg-neutral-50 transition-colors duration-100">
              <td colSpan={totalCols} className="px-4 py-2.5">
                <button
                  onClick={onAdd}
                  className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700
                             font-medium transition-colors duration-150"
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M7 1v12M1 7h12" />
                  </svg>
                  Agregar
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
