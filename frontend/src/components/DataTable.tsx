import { useState, useEffect, useRef, type ReactNode } from 'react'
import type { MetaColumnDef, ListOption } from '@/hooks/useMetaColumns'

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
  onEdit?: (row: T, newValue: string) => void
  getValue?: (row: T) => string
  selectOptions?: { value: string; label: string; group?: string }[]
  multiple?: boolean
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
  className?: string
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
        <div className="absolute left-0 top-6 z-20 w-40 bg-white border border-neutral-100 rounded-xl shadow-md shadow-neutral-200/60 overflow-hidden text-left py-1">
          <button
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-neutral-600 hover:bg-neutral-50 hover:text-brand-600 transition-colors duration-100"
            onClick={(e) => { e.stopPropagation(); onEdit(); onClose() }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" />
            </svg>
            Editar columna
          </button>
          <div className="mx-3 border-t border-neutral-100" />
          <button
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors duration-100"
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

function MultiTagCell<T>({ row, col }: { row: T; col: Column<T> }) {
  const currentValue = col.getValue?.(row) ?? ''
  const [selectedIds, setSelectedIds] = useState(() => currentValue.split(',').filter(Boolean))
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedIds(currentValue.split(',').filter(Boolean))
  }, [currentValue])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    setSelectedIds(next)
    col.onEdit?.(row, next.join(','))
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = selectedIds.filter((i) => i !== id)
    setSelectedIds(next)
    col.onEdit?.(row, next.join(','))
  }

  const selectedOptions = (col.selectOptions ?? []).filter((o) => selectedIds.includes(o.value))
  const filtered = (col.selectOptions ?? []).filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.group ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div ref={containerRef} className="relative flex flex-col items-start gap-1">
      {selectedOptions.length === 0 && <span className="text-neutral-400 text-sm">—</span>}
      {selectedOptions.map((opt) => (
        <span key={opt.value} className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">
          {opt.label}
          <button
            onClick={(e) => remove(opt.value, e)}
            className="text-brand-400 hover:text-brand-700 transition-colors leading-none"
            aria-label={`Quitar ${opt.label}`}
          >
            <svg width="7" height="7" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l6 6M7 1L1 7" />
            </svg>
          </button>
        </span>
      ))}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-brand-100 text-neutral-400 hover:text-brand-600 flex items-center justify-center transition-colors shrink-0"
        aria-label="Agregar"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 1v6M1 4h6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-8 z-30 w-60 bg-white border border-neutral-200 rounded-xl shadow-lg shadow-neutral-200/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-neutral-100">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setSearch('') } }}
              placeholder="Buscar..."
              className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-neutral-400 text-center">Sin resultados</p>
            )}
            {filtered.map((opt) => {
              const isSelected = selectedIds.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand-600' : 'border border-neutral-300'}`}>
                    {isSelected && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4l2 2 4-4" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-xs truncate ${isSelected ? 'text-brand-700 font-medium' : 'text-neutral-700'}`}>{opt.label}</span>
                    {opt.group && <span className="block text-[10px] text-neutral-400 truncate">{opt.group}</span>}
                  </span>
                </button>
              )
            })}
          </div>
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
  className,
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
    <div className={`overflow-auto rounded-lg border border-neutral-200 shadow-sm ${className ?? 'w-full'}`}>
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
              <th key={def.key} className={`group ${thBase} text-neutral-400`}>
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
                      onClick={isEditing && col.onEdit && !col.multiple ? (e) => {
                        e.stopPropagation()
                        const currentVal = col.getValue?.(row) ?? ''
                        setEditingCell({ rowKey, colKey: `__col_${ci}`, value: currentVal })
                      } : undefined}
                    >
                      {col.selectOptions && col.multiple && isEditing ? (
                        <MultiTagCell row={row} col={col} />
                      ) : isEditingPrimary ? (
                        col.selectOptions ? (
                          <select
                            autoFocus
                            value={editingCell!.value}
                            onChange={(e) => { col.onEdit?.(row, e.target.value); setEditingCell(null) }}
                            onBlur={() => setEditingCell(null)}
                            className={`${inlineCls} bg-white`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {col.selectOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
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
                        )
                      ) : (
                        <span className={isEditing && col.onEdit ? `${col.selectOptions ? 'cursor-pointer' : 'cursor-text'} hover:bg-brand-50 rounded px-0.5 transition-colors duration-100 block` : ''}>
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
                              className="text-brand-600 hover:text-brand-700 underline underline-offset-2 inline-flex items-center gap-0.5 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {currentVal.length > 50 ? currentVal.slice(0, 50) + '…' : currentVal}
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
                                : <span className="text-gray-900">{currentVal}</span>
                            })()
                          ) : currentVal && def.color ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: `${def.color}28`, color: def.color }}>{currentVal}</span>
                          ) : (
                            currentVal ? <span className="text-gray-900">{currentVal}</span> : <span className="text-neutral-400">—</span>
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
