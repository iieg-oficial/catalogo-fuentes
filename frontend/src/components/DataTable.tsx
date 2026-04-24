import { useState, useEffect, useRef, type ReactNode } from 'react'
import type { MetaColumnDef, ListOption } from '@/hooks/useMetaColumns'

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
  onEdit?: (row: T, newValue: string) => void
  getValue?: (row: T) => string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  caption?: string
  onRowClick?: (row: T) => void
  getKey: (row: T) => string
  isEditing?: boolean
  // Inline add row
  onAdd?: () => void
  addRowCells?: ReactNode
  addRowActions?: ReactNode
  // Meta columns
  metaColumnDefs?: MetaColumnDef[]
  getMeta?: (row: T) => Record<string, unknown>
  onAddColumn?: () => void
  onDeleteColumn?: (key: string) => void
  onEditColumn?: (def: MetaColumnDef) => void
  onEditMetaCell?: (row: T, key: string, value: string) => void
  // Meta inputs for add row (controlled by parent)
  addRowMetaValues?: Record<string, string>
  onAddRowMetaChange?: (key: string, value: string) => void
  // Row deletion
  onDeleteRow?: (row: T) => void
}

const thBase = 'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap'
const tdBase = 'px-4 py-2.5 align-top'

const inlineCls =
  'w-full px-1.5 py-0.5 text-sm border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

const TYPE_ICON: Record<string, ReactNode> = {
  text:    <span className="font-bold opacity-40 mr-1">T</span>,
  number:  <span className="font-bold opacity-40 mr-1">#</span>,
  url:     <span className="font-bold opacity-40 mr-1">↔</span>,
  date:    <span className="font-bold opacity-40 mr-1">D</span>,
  boolean: <span className="font-bold opacity-40 mr-1">✓</span>,
  list:    <span className="font-bold opacity-40 mr-1">≡</span>,
}

function ColMenu({
  open,
  onOpen,
  onClose,
  onDelete,
  onEdit,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); open ? onClose() : onOpen() }}
        className="opacity-0 group-hover:opacity-100 ml-1 text-neutral-300 hover:text-neutral-500
                   transition-opacity duration-150 leading-none align-middle"
        title="Opciones de columna"
        aria-label="Opciones de columna"
      >
        ···
      </button>
      {open && (
        <div className="absolute left-0 top-5 z-20 w-36 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden text-left">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); onEdit(); onClose() }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" />
            </svg>
            Editar columna
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(); onClose() }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4" />
            </svg>
            Borrar columna
          </button>
        </div>
      )}
    </div>
  )
}

export default function DataTable<T>({
  columns,
  rows,
  caption,
  onRowClick,
  getKey,
  isEditing = false,
  onAdd,
  addRowCells,
  addRowActions,
  metaColumnDefs,
  getMeta,
  onAddColumn,
  onDeleteColumn,
  onEditColumn,
  onEditMetaCell,
  addRowMetaValues,
  onAddRowMetaChange,
  onDeleteRow,
}: DataTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowKey: string; colKey: string; value: string } | null>(null)
  const [openColMenu, setOpenColMenu] = useState<string | null>(null)
  const hasActionsCol = !!onDeleteRow

  const totalCols =
    columns.length +
    (metaColumnDefs?.length ?? 0) +
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
            {metaColumnDefs?.map((def) => (
              <th key={def.key} className={`group ${thBase} text-neutral-300`}>
                <span className="inline-flex items-center gap-0.5">
                  {TYPE_ICON[def.type]}
                  {def.label ?? def.key}
                  {(onDeleteColumn || onEditColumn) && (
                    <ColMenu
                      open={openColMenu === def.key}
                      onOpen={() => setOpenColMenu(def.key)}
                      onClose={() => setOpenColMenu(null)}
                      onDelete={() => onDeleteColumn?.(def.key)}
                      onEdit={() => onEditColumn?.(def)}
                    />
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

          {rows.map((row) => {
            const rowKey = getKey(row)
            return (
              <tr
                key={rowKey}
                onClick={() => { if (!isEditing) onRowClick?.(row) }}
                onKeyDown={!isEditing && onRowClick ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick(row)
                  }
                } : undefined}
                tabIndex={!isEditing && onRowClick ? 0 : undefined}
                className={`group bg-white ${
                  !isEditing && onRowClick
                    ? 'cursor-pointer hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500'
                    : isEditing ? 'cursor-default' : ''
                }`}
              >
                {columns.map((col, ci) => {
                  const isEditingPrimary =
                    isEditing &&
                    !!col.onEdit &&
                    editingCell?.rowKey === rowKey &&
                    editingCell?.colKey === `__col_${ci}`
                  return (
                    <td
                      key={ci}
                      className={`${tdBase} ${col.className ?? ''}`}
                      onClick={isEditing && col.onEdit ? (e) => {
                        e.stopPropagation()
                        const currentVal = col.getValue?.(row) ?? ''
                        setEditingCell({ rowKey, colKey: `__col_${ci}`, value: currentVal })
                      } : undefined}
                    >
                      {isEditingPrimary ? (
                        <input
                          autoFocus
                          value={editingCell!.value}
                          onChange={(e) => setEditingCell((prev) => prev ? { ...prev, value: e.target.value } : null)}
                          onBlur={() => {
                            col.onEdit?.(row, editingCell!.value)
                            setEditingCell(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { col.onEdit?.(row, editingCell!.value); setEditingCell(null) }
                            if (e.key === 'Escape') setEditingCell(null)
                          }}
                          className={inlineCls}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={isEditing && col.onEdit ? 'cursor-text hover:bg-brand-50 rounded px-0.5 transition-colors duration-100 block' : ''}>
                          {col.render(row)}
                        </span>
                      )}
                    </td>
                  )
                })}

                {metaColumnDefs?.map((def) => {
                  const isEditingMeta = editingCell?.rowKey === rowKey && editingCell?.colKey === def.key
                  const rawVal = getMeta?.(row)?.[def.key]
                  const currentVal = rawVal != null ? String(rawVal) : ''
                  return (
                    <td
                      key={def.key}
                      className={`${tdBase} text-xs text-neutral-400 ${def.type === 'number' ? 'text-right' : ''}`}
                      onClick={(e) => {
                        if (onEditMetaCell) {
                          e.stopPropagation()
                          setEditingCell({ rowKey, colKey: def.key, value: currentVal })
                        }
                      }}
                    >
                      {isEditingMeta ? (
                        def.type === 'boolean' ? (
                          <select
                            autoFocus
                            value={editingCell!.value}
                            onChange={(e) => { onEditMetaCell?.(row, def.key, e.target.value); setEditingCell(null) }}
                            onBlur={() => setEditingCell(null)}
                            className={`${inlineCls} bg-white`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">—</option>
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                          </select>
                        ) : def.type === 'list' && def.options?.length ? (
                          <select
                            autoFocus
                            value={editingCell!.value}
                            onChange={(e) => { onEditMetaCell?.(row, def.key, e.target.value); setEditingCell(null) }}
                            onBlur={() => setEditingCell(null)}
                            className={`${inlineCls} bg-white`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">—</option>
                            {def.options.map((opt) => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                          </select>
                        ) : (
                          <input
                            autoFocus
                            type={def.type === 'date' ? 'date' : 'text'}
                            value={editingCell!.value}
                            onChange={(e) => setEditingCell((prev) => prev ? { ...prev, value: e.target.value } : null)}
                            onBlur={() => {
                              onEditMetaCell?.(row, def.key, editingCell!.value)
                              setEditingCell(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { onEditMetaCell?.(row, def.key, editingCell!.value); setEditingCell(null) }
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            className={inlineCls}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )
                      ) : (
                        <span className={onEditMetaCell ? 'cursor-text hover:bg-brand-50 rounded px-0.5 transition-colors duration-100' : ''}>
                          {currentVal && def.type === 'url' ? (
                            <a
                              href={currentVal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-600 hover:text-brand-700 underline underline-offset-2 inline-flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {currentVal}
                              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M3 1h6v6M9 1 1 9" />
                              </svg>
                            </a>
                          ) : def.type === 'boolean' ? (
                            currentVal === 'true'
                              ? <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-700">Sí</span>
                              : currentVal === 'false'
                                ? <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-500">No</span>
                                : <span>—</span>
                          ) : def.type === 'list' && currentVal ? (
                            (() => {
                              const opt = (def.options as ListOption[] | undefined)?.find((o) => o.label === currentVal)
                              return opt?.color
                                ? <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: `${opt.color}28`, color: opt.color }}>{currentVal}</span>
                                : <span>{currentVal}</span>
                            })()
                          ) : currentVal && def.color ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: `${def.color}28`, color: def.color }}>{currentVal}</span>
                          ) : (
                            currentVal || '—'
                          )}
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
            )
          })}

          {/* Inline add row */}
          {addRowCells && (
            <tr className="bg-brand-50/60 border-t border-brand-100">
              {addRowCells}
              {metaColumnDefs?.map((def) => (
                <td key={def.key} className="px-4 py-2">
                  {onAddRowMetaChange && (
                    def.type === 'boolean' ? (
                      <select
                        value={addRowMetaValues?.[def.key] ?? ''}
                        onChange={(e) => onAddRowMetaChange(def.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white transition-colors duration-150"
                      >
                        <option value="">—</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : def.type === 'list' && def.options?.length ? (
                      <select
                        value={addRowMetaValues?.[def.key] ?? ''}
                        onChange={(e) => onAddRowMetaChange(def.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white transition-colors duration-150"
                      >
                        <option value="">—</option>
                        {def.options.map((opt) => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <input
                        type={def.type === 'date' ? 'date' : 'text'}
                        value={addRowMetaValues?.[def.key] ?? ''}
                        onChange={(e) => onAddRowMetaChange(def.key, e.target.value)}
                        placeholder={(def.label ?? def.key) + '…'}
                        className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md
                                   focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400
                                   bg-white placeholder-neutral-300 transition-colors duration-150"
                      />
                    )
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
