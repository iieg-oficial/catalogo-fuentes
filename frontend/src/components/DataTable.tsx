import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { MetaColumnDef, ListOption } from '@/hooks/useMetaColumns'

export interface Column<T> {
  header: string
  icon?: ReactNode
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

const thBase = 'px-4 py-[10px] text-[11px] font-medium uppercase tracking-[0.06em] whitespace-nowrap text-ink/[55%]'
const tdBase = 'px-4 py-[14px] align-top'

const inlineCls =
  'w-full px-1.5 py-0.5 text-sm border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

const emptyDash = (
  <span className="font-mono text-ink/[32%] text-[13px]">—</span>
)

const TYPE_ICON: Record<string, ReactNode> = {
  text: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
      <path d="M1.5 3h9M6 3v7M3.5 10h5"/>
    </svg>
  ),
  number: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
      <path d="M4 1.5L3 10.5M9 1.5L8 10.5M1.5 4.5h9M1.5 7.5h9"/>
    </svg>
  ),
  url: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
      <path d="M4.5 7.5a2.5 2.5 0 003.5 0L9.5 6A2.5 2.5 0 005 2.5L4.5 3"/>
      <path d="M7.5 4.5a2.5 2.5 0 00-3.5 0L2.5 6A2.5 2.5 0 007 9.5l.5-.5"/>
    </svg>
  ),
  date: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="1" y="2" width="10" height="9" rx="1"/>
      <path d="M8 1v2M4 1v2M1 5h10"/>
    </svg>
  ),
  boolean: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="1" y="3.5" width="10" height="5" rx="2.5"/>
      <circle cx="8.5" cy="6" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  list: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
      <path d="M4 3h7M4 6h7M4 9h7"/>
      <circle cx="1.5" cy="3" r="0.65" fill="currentColor" stroke="none"/>
      <circle cx="1.5" cy="6" r="0.65" fill="currentColor" stroke="none"/>
      <circle cx="1.5" cy="9" r="0.65" fill="currentColor" stroke="none"/>
    </svg>
  ),
}

const EYE_ICON = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
    <circle cx="8" cy="8" r="2.5"/>
  </svg>
)

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
    <div className={`relative inline-block ${open ? 'z-[9999]' : ''}`} ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); open ? onClose() : onOpen() }}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 ml-1 text-ink/30 hover:text-ink/60
                   transition-opacity duration-150 leading-none align-middle"
        title="Opciones de columna"
        aria-label="Opciones de columna"
      >
        ···
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-20 w-40 bg-white border border-neutral-100 rounded-xl shadow-md shadow-neutral-200/60 overflow-hidden text-left py-1">
          <button
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-neutral-600 hover:bg-brand-500/[6%] hover:text-brand-600 transition-colors duration-100"
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
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})

  useEffect(() => {
    setSelectedIds(currentValue.split(',').filter(Boolean))
  }, [currentValue])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    const handleScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return
      setOpen(false)
      setSearch('')
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
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
    o.label.trim() !== '' && (
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.group ?? '').toLowerCase().includes(search.toLowerCase())
    ),
  )

  const isEmpty = selectedOptions.length === 0

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-neutral-200 rounded-xl shadow-lg shadow-neutral-200/50 overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-neutral-100">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setSearch('') } }}
          placeholder="Buscar..."
          aria-label="Buscar opciones"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-brand-500/[4%] transition-colors"
            >
              <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand-500' : 'border border-neutral-300'}`}>
                {isSelected && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4l2 2 4-4" />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-xs truncate ${isSelected ? 'text-brand-600 font-medium' : 'text-neutral-700'}`}>{opt.label}</span>
                {opt.group && <span className="block text-[10px] text-neutral-400 truncate">{opt.group}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div ref={containerRef} className="relative flex flex-col items-start gap-1 group/multitag">
      {isEmpty && emptyDash}
      {selectedOptions.map((opt) => (
        <span key={opt.value} className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-600 text-[13px] font-medium px-[10px] py-[3px] rounded-full">
          {opt.label}
          <button
            onClick={(e) => remove(opt.value, e)}
            className="p-0.5 text-brand-500/60 hover:text-brand-600 transition-colors leading-none"
            aria-label={`Quitar ${opt.label}`}
          >
            <svg width="7" height="7" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l6 6M7 1L1 7" />
            </svg>
          </button>
        </span>
      ))}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const dropdownWidth = 240
            const left = rect.left + dropdownWidth > window.innerWidth
              ? Math.max(8, rect.right - dropdownWidth)
              : rect.left
            setDropdownStyle({
              position: 'fixed',
              top: rect.bottom + 4,
              left,
              zIndex: 9999,
              width: dropdownWidth,
            })
          }
          setOpen((v) => !v)
        }}
        className={`w-6 h-6 rounded-full bg-ink/[6%] hover:bg-brand-500/10 text-ink/40 hover:text-brand-600 flex items-center justify-center transition-all shrink-0 ${isEmpty ? 'opacity-0 group-hover/multitag:opacity-100' : ''}`}
        aria-label="Agregar"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 1v6M1 4h6" />
        </svg>
      </button>
      {dropdown}
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
  const hasLeftActionsCol = !!onRowClick || hasActionsCol

  const totalCols =
    columns.length +
    (metaColumnDefs?.length ?? 0) +
    (onAddColumn ? 1 : 0) +
    (hasLeftActionsCol ? 1 : 0)

  return (
    <div className={`overflow-auto rounded-lg border border-ink/[8%] shadow-sm ${className ?? 'w-full'}`}>
      <table className="min-w-full text-[15px]">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr className="bg-white border-b border-ink/[8%] text-left">
            {hasLeftActionsCol && (
              <th className={`${thBase} pl-4 pr-2 w-14`}>
                Acciones
              </th>
            )}
            {columns.map((col, i) => (
              <th key={i} className={`${thBase} ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
            {metaColumnDefs?.map((def) => (
              <th key={def.key} className={`group ${thBase}`}>
                <span className="inline-flex items-center gap-1.5">
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
              <th className="px-3 py-[10px] w-10 text-center">
                <button
                  onClick={onAddColumn}
                  className="group/addcol w-[26px] h-[26px] rounded-md flex items-center justify-center
                             text-ink/40 hover:text-brand-600 hover:bg-brand-500/10
                             transition-all duration-150"
                  title="Agregar campo"
                  aria-label="Agregar campo"
                >
                  <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round"
                    className="transition-transform duration-200 group-hover/addcol:rotate-90"
                  >
                    <path d="M7 1v12M1 7h12" />
                  </svg>
                </button>
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-ink/[5%]">
          {rows.length === 0 && !addRowCells && !onAdd && (
            <tr>
              <td colSpan={totalCols} className="px-6 py-14 text-center">
                <svg className="mx-auto mb-3 text-ink/[12%]" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2h7.5L22 8.5V24a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2z"/>
                  <path d="M15.5 2v7H22M10 14h8M10 18h6"/>
                </svg>
                <p className="text-sm text-ink/40">Sin registros</p>
              </td>
            </tr>
          )}

          {rows.length === 0 && !addRowCells && onAdd && (
            <tr>
              <td colSpan={totalCols} className="px-6 py-14 text-center">
                <svg className="mx-auto mb-3 text-ink/[12%]" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2h7.5L22 8.5V24a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2z"/>
                  <path d="M15.5 2v7H22M10 14h8M10 18h6"/>
                </svg>
                <p className="text-sm text-ink/40">Sin registros</p>
                <p className="text-xs text-ink/[28%] mt-1">Usa "+ Agregar" para crear el primero</p>
              </td>
            </tr>
          )}

          {rows.map((row, rowIndex) => {
            const rowKey = getKey(row)
            return (
              <tr
                key={rowKey}
                onClick={!isEditing && onRowClick ? () => onRowClick(row) : undefined}
                className={`group row-item-enter bg-white transition-colors duration-100 hover:bg-brand-500/[2.5%] ${
                  !isEditing && onRowClick ? 'cursor-pointer' : isEditing ? 'cursor-default' : ''
                }`}
                style={{ animationDelay: `${Math.min(rowIndex, 10) * 22}ms` }}
              >
                {hasLeftActionsCol && (
                  <td className="w-[88px] pl-4 pr-2 py-[14px] align-middle" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      {onRowClick && (
                        <button
                          onClick={() => onRowClick(row)}
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center
                                     text-ink/[35%] group-hover:text-ink/[55%]
                                     hover:bg-brand-500/10 hover:text-brand-600
                                     transition-all duration-150 motion-safe:active:scale-90"
                          aria-label="Ver detalle"
                          title="Ver detalle"
                        >
                          {EYE_ICON}
                        </button>
                      )}
                      {hasActionsCol && (
                        <button
                          onClick={() => onDeleteRow?.(row)}
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center
                                     text-ink/[35%] hover:bg-error-600/[8%] hover:text-error-600
                                     transition-all duration-150 motion-safe:active:scale-90"
                          title="Eliminar"
                          aria-label="Eliminar fila"
                        >
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
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
                            aria-label={col.header}
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
                            aria-label={col.header}
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
                        <span className={isEditing && col.onEdit ? `${col.selectOptions ? 'cursor-pointer' : 'cursor-text'} hover:bg-brand-500/[6%] rounded px-0.5 transition-colors duration-100 block` : ''}>
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
                      className={`${tdBase} text-ink/70 ${def.type === 'number' ? 'text-right font-["JetBrains_Mono",monospace]' : ''}`}
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
                            aria-label={def.label ?? def.key}
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
                            aria-label={def.label ?? def.key}
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
                            aria-label={def.label ?? def.key}
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
                        <span className={onEditMetaCell ? 'cursor-text hover:bg-brand-500/[6%] rounded px-0.5 transition-colors duration-100' : ''}>
                          {currentVal && def.type === 'url' ? (
                            <a
                              href={currentVal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-500 hover:text-brand-600 no-underline inline-flex items-center gap-1 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {currentVal.length > 50 ? currentVal.slice(0, 50) + '…' : currentVal}
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
                                <path d="M2 1h7v7M9 1 1 9" />
                              </svg>
                            </a>
                          ) : def.type === 'boolean' ? (
                            currentVal === 'true'
                              ? <span className="inline-block px-[10px] py-[3px] rounded-full text-[13px] font-medium bg-brand-500/10 text-brand-600">Sí</span>
                              : currentVal === 'false'
                                ? <span className="inline-block px-[10px] py-[3px] rounded-full text-[13px] font-medium bg-ink/[6%] text-ink/50">No</span>
                                : emptyDash
                          ) : def.type === 'list' && currentVal ? (
                            (() => {
                              const opt = (def.options as ListOption[] | undefined)?.find((o) => o.label === currentVal)
                              return opt?.color
                                ? <span className="inline-block px-[10px] py-[3px] rounded-full text-[13px] font-medium whitespace-nowrap" style={{ backgroundColor: `${opt.color}1a`, color: opt.color }}>{currentVal}</span>
                                : <span className="inline-block px-[10px] py-[3px] rounded-full text-[13px] font-medium bg-brand-500/10 text-brand-600 whitespace-nowrap">{currentVal}</span>
                            })()
                          ) : def.type === 'number' && currentVal ? (
                            <span className="font-['JetBrains_Mono',monospace] text-[13px] text-ink/[85%]">{currentVal}</span>
                          ) : currentVal && def.color ? (
                            <span className="inline-block px-[10px] py-[3px] rounded-full text-[13px] font-medium whitespace-nowrap" style={{ backgroundColor: `${def.color}1a`, color: def.color }}>{currentVal}</span>
                          ) : (
                            currentVal ? <span className="text-ink">{currentVal}</span> : emptyDash
                          )}
                        </span>
                      )}
                    </td>
                  )
                })}

                {onAddColumn && <td />}
              </tr>
            )
          })}

          {/* Inline add row */}
          {addRowCells && (
            <tr className="bg-brand-500/[2.5%] border-t border-ink/[5%]">
              {hasLeftActionsCol && (
                <td className="pl-4 pr-2 py-2 w-[88px] text-center whitespace-nowrap">
                  {addRowActions}
                </td>
              )}
              {addRowCells}
              {metaColumnDefs?.map((def) => (
                <td key={def.key} className="px-4 py-2">
                  {onAddRowMetaChange && (
                    def.type === 'boolean' ? (
                      <select
                        aria-label={def.label ?? def.key}
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
                        aria-label={def.label ?? def.key}
                        value={addRowMetaValues?.[def.key] ?? ''}
                        onChange={(e) => onAddRowMetaChange(def.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white transition-colors duration-150"
                      >
                        <option value="">—</option>
                        {def.options.map((opt) => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <input
                        aria-label={def.label ?? def.key}
                        type={def.type === 'date' ? 'date' : 'text'}
                        value={addRowMetaValues?.[def.key] ?? ''}
                        onChange={(e) => onAddRowMetaChange(def.key, e.target.value)}
                        placeholder={(def.label ?? def.key) + '…'}
                        className="w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md
                                   focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500
                                   bg-white placeholder-ink/30 transition-colors duration-150"
                      />
                    )
                  )}
                </td>
              ))}
              {onAddColumn && <td />}
            </tr>
          )}

          {/* + Agregar row */}
          {!addRowCells && onAdd && (
            <tr className="bg-white hover:bg-brand-500/[2.5%] transition-colors duration-100">
              <td colSpan={totalCols} className="px-4 py-3">
                <button
                  onClick={onAdd}
                  className="group/add flex items-center gap-1.5 text-[13px] text-brand-500 hover:text-brand-600
                             font-medium transition-all duration-150 motion-safe:active:scale-95 hover:gap-2"
                >
                  <svg
                    width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor"
                    strokeWidth="1.75" strokeLinecap="round"
                    className="transition-transform duration-150 group-hover/add:rotate-90"
                  >
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
