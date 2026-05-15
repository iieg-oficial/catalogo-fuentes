import { useState, useEffect, useRef, useMemo, createContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSidebar } from '@/context/SidebarContext'
import { SECTION_LABEL_COLOR } from '@/consts/statusColors'

export const CellContext = createContext<{ rowIndex: number; columnName: string } | null>(null)
import SingleSelectPanel from '@/components/SingleSelectPanel'
import DatePickerPanel from '@/components/DatePickerPanel'
import JsonEditorPanel from '@/components/JsonEditorPanel'
import SelectInput from '@/components/SelectInput'
import type { Column } from '@/components/DataTable'

type ColumnType = 'text' | 'number' | 'url' | 'date' | 'boolean' | 'list' | 'tag' | 'priority'

interface ListOption {
  label: string
  color?: string
}

interface MetaColumnDef {
  key: string
  label?: string
  type: ColumnType
  options?: ListOption[]
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CatalogGridProps<T> {
  eyebrow: string
  title: string
  addLabel: string
  searchPlaceholder?: string
  entityLabel: string
  rows: T[]
  columns: Column<T>[]
  getKey: (row: T) => string
  onRowClick?: (row: T) => void
  canWrite?: boolean
  onAdd?: () => void
  addRowCells?: ReactNode
  addRowActions?: ReactNode
  metaColumnDefs?: MetaColumnDef[]
  getMeta?: (row: T) => Record<string, unknown>
  onAddColumn?: () => void
  onDeleteColumn?: (key: string) => void
  onEditColumn?: (def: MetaColumnDef) => void
  canModifyColumn?: (def: MetaColumnDef) => boolean
  onEditMetaCell?: (row: T, key: string, value: string) => void
  addRowMetaValues?: Record<string, string>
  onAddRowMetaChange?: (key: string, value: string) => void
  onDeleteRows?: (keys: string[]) => void
  onAddRowSave?: () => void
  search: string
  onSearch: (v: string) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_DASH = (
  <span className="font-mono text-ink/[30%] text-[13px] select-none">—</span>
)

const INLINE_INPUT_CLS =
  'w-full px-1.5 py-0.5 text-[13px] border border-brand-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const TYPE_ICON: Record<string, ReactNode> = {
  text: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1.5 3h9M6 3v7M3.5 10h5" />
    </svg>
  ),
  number: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 1.5L3 10.5M9 1.5L8 10.5M1.5 4.5h9M1.5 7.5h9" />
    </svg>
  ),
  url: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4.5 7.5a2.5 2.5 0 003.5 0L9.5 6A2.5 2.5 0 005 2.5L4.5 3" />
      <path d="M7.5 4.5a2.5 2.5 0 00-3.5 0L2.5 6A2.5 2.5 0 007 9.5l.5-.5" />
    </svg>
  ),
  date: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="10" height="9" rx="1" />
      <path d="M8 1v2M4 1v2M1 5h10" />
    </svg>
  ),
  boolean: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3.5" width="10" height="5" rx="2.5" />
      <circle cx="8.5" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  list: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 3h7M4 6h7M4 9h7" />
      <circle cx="1.5" cy="3" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="1.5" cy="6" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="1.5" cy="9" r="0.65" fill="currentColor" stroke="none" />
    </svg>
  ),
  tag: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2v4l5 5 4-4-5-5H2z" /><circle cx="4" cy="4" r=".7" />
    </svg>
  ),
  priority: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9h2V5H2zM5 9h2V3H5zM8 9h2V1H8z" />
    </svg>
  ),
}

const PRIORITY_LEVELS = [
  { label: 'Urgente',       color: '#dc2626' },
  { label: 'Alta',          color: '#f97316' },
  { label: 'Media',         color: '#f59e0b' },
  { label: 'Baja',          color: '#22c55e' },
  { label: 'Sin prioridad', color: '#94a3b8' },
]

const SORT_UP_ICON = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 10V2M6 2L3 5M6 2l3 3" />
  </svg>
)
const SORT_DOWN_ICON = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2v8M6 10L3 7M6 10l3-3" />
  </svg>
)
const FILTER_ICON = (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h12l-4.5 6v4l-3 1.5V9L2 3z" />
  </svg>
)
const EYE_ICON = (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
)

// ---------------------------------------------------------------------------
// MultiSelectPanel
// ---------------------------------------------------------------------------

function MultiSelectPanel({
  options, value, onChange, onClose, top, left,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  onClose: () => void
  top: number
  left: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const selected = new Set(value.split(',').filter(Boolean))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  const toggle = (v: string) => {
    const next = new Set(selected)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    onChange([...next].join(','))
  }

  return createPortal(
    <div
      ref={ref}
      data-portal
      style={{ position: 'fixed', top, left, zIndex: 9999 }}
      className="bg-white border border-ink/[10%] rounded-xl shadow-xl shadow-ink/[6%] min-w-[180px] max-w-[240px] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1.5 max-h-48 overflow-y-auto">
        {options.map((opt) => {
          const isChecked = selected.has(opt.value)
          return (
            <button key={opt.value} type="button" onClick={() => toggle(opt.value)}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors duration-100 ${
                isChecked ? 'text-brand-700 bg-brand-500/[5%]' : 'text-ink/70 hover:bg-ink/[3%]'
              }`}>
              <span className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors duration-100 ${
                isChecked ? 'bg-brand-600 border-brand-600' : 'border-ink/[18%] bg-white'
              }`}>
                {isChecked && (
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.5 5L4 7.5 8.5 2.5" />
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          )
        })}
        {options.length === 0 && <p className="px-3 py-2.5 text-[12px] text-ink/40">Sin opciones disponibles</p>}
      </div>
      <div className="border-t border-ink/[6%] px-2 py-1.5">
        <button onClick={onClose}
          className="w-full px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-500/[6%] rounded-md transition-colors">
          Listo
        </button>
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// FilterPanel
// ---------------------------------------------------------------------------

function FilterPanel({
  availableValues,
  value,
  onChange,
  onClose,
  top,
  left,
  label,
}: {
  availableValues: string[]
  value: string | string[] | null
  onChange: (v: string | string[] | null) => void
  onClose: () => void
  top: number
  left: number
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const useCheckboxes = availableValues.length > 0 && availableValues.length <= 20
  const [pending, setPending] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : [],
  )
  const [textVal, setTextVal] = useState(typeof value === 'string' ? value : '')
  const hasActiveFilter = value != null && (Array.isArray(value) ? value.length > 0 : String(value).length > 0)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  const handleApply = () => {
    onChange(useCheckboxes ? (pending.length ? pending : null) : (textVal || null))
    onClose()
  }

  const handleClear = () => {
    setPending([])
    setTextVal('')
    onChange(null)
  }

  return createPortal(
    <div
      ref={ref}
      data-portal
      style={{ position: 'fixed', top, left, zIndex: 9999 }}
      className="bg-white rounded-xl border border-ink/[10%] shadow-xl shadow-ink/[6%] min-w-[220px] max-w-[280px] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2.5 border-b border-ink/[6%]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/70">
          Filtrar · {label}
        </p>
      </div>

      {useCheckboxes ? (
        <div className="py-1.5 max-h-52 overflow-y-auto">
          {availableValues.map((opt) => {
            const isChecked = pending.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setPending(isChecked ? pending.filter((v) => v !== opt) : [...pending, opt])}
                className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors duration-100 ${
                  isChecked ? 'text-brand-700 bg-brand-500/[5%]' : 'text-ink/70 hover:bg-ink/[3%]'
                }`}
              >
                <span className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors duration-100 ${
                  isChecked ? 'bg-brand-600 border-brand-600' : 'border-ink/[18%] bg-white'
                }`}>
                  {isChecked && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1.5 5L4 7.5 8.5 2.5" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="p-2">
          <input
            autoFocus
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleApply() }}
            placeholder="Buscar..."
            className="w-full px-2.5 py-1.5 text-[13px] border border-ink/[12%] rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      )}

      <div className="border-t border-ink/[6%] px-2.5 py-2 flex items-center gap-2">
        <button
          onClick={handleClear}
          disabled={!hasActiveFilter}
          className="flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-colors text-brand-600 hover:bg-brand-500/[6%] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          Limpiar
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-2 py-1.5 text-[11px] font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// GridColHeader
// ---------------------------------------------------------------------------

function GridColHeader({
  label,
  icon,
  typeKey,
  sortField,
  sortId,
  sortDir,
  onSort,
  filterValue,
  onFilterChange,
  availableValues,
  width,
  hasMenu,
  menuOpen,
  onMenuOpen,
  onMenuClose,
  onMenuDelete,
  onMenuEdit,
}: {
  label: string
  icon?: ReactNode
  typeKey: string
  sortField: string | null
  sortId: string
  sortDir: 'asc' | 'desc'
  onSort: (id: string) => void
  filterValue: string | string[] | null
  onFilterChange: (id: string, v: string | string[] | null) => void
  availableValues: string[]
  width?: number | string
  hasMenu?: boolean
  menuOpen?: boolean
  onMenuOpen?: () => void
  onMenuClose?: () => void
  onMenuDelete?: () => void
  onMenuEdit?: () => void
}) {
  const [hover, setHover] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 })
  const isSorted = sortField === sortId
  const hasFilter = filterValue != null && (typeof filterValue === 'string' ? filterValue.length > 0 : filterValue.length > 0)
  const menuRef = useRef<HTMLDivElement>(null)
  const filterBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onMenuClose?.()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen, onMenuClose])

  return (
    <th
      className="border-r border-ink/[5%]"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        backgroundColor: '#FBFAFC',
        borderBottom: '1px solid rgba(26,22,37,.10)',
        width: width ?? 'auto',
        minWidth: typeof width === 'number' ? width : 320,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        padding: 0,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 10px', position: 'relative' }}>
        <span style={{ display: 'flex', color: 'rgba(26,22,37,.40)', flexShrink: 0 }}>
          {icon ?? TYPE_ICON[typeKey] ?? TYPE_ICON.text}
        </span>

        <button
          onClick={() => onSort(sortId)}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
            textTransform: 'uppercase', color: 'rgba(26,22,37,.62)',
            textAlign: 'left', overflow: 'hidden',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          {isSorted && (
            <span style={{ display: 'flex', color: '#5C2472', flexShrink: 0 }}>
              {sortDir === 'asc' ? SORT_UP_ICON : SORT_DOWN_ICON}
            </span>
          )}
        </button>

        <button
          ref={filterBtnRef}
          onClick={(e) => {
            e.stopPropagation()
            if (!filterOpen && filterBtnRef.current) {
              const r = filterBtnRef.current.getBoundingClientRect()
              setFilterPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 292) })
            }
            setFilterOpen((o) => !o)
          }}
          style={{
            opacity: hasFilter ? 1 : hover || filterOpen ? 0.7 : 0,
            width: 20, height: 20, borderRadius: 4,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: hasFilter ? 'rgba(110,37,139,.12)' : 'transparent',
            color: hasFilter ? '#5C2472' : 'rgba(26,22,37,.55)',
            border: 'none', cursor: 'pointer',
            transition: 'opacity 120ms, background 120ms', flexShrink: 0,
          }}
          title="Filtrar"
        >
          {FILTER_ICON}
        </button>

        {hasMenu && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); menuOpen ? onMenuClose?.() : onMenuOpen?.() }}
              style={{
                opacity: hover || menuOpen ? 1 : 0.28,
                width: 20, height: 20, borderRadius: 4,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: menuOpen ? 'rgba(26,22,37,.06)' : 'transparent',
                color: 'rgba(26,22,37,.40)', border: 'none', cursor: 'pointer',
                transition: 'opacity 120ms', flexShrink: 0,
                fontSize: 14, lineHeight: 1, letterSpacing: 1,
              }}
              title="Opciones"
            >
              ···
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-50 w-44 bg-white border border-neutral-100 rounded-xl shadow-md overflow-hidden py-1">
                <button
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-neutral-600 hover:bg-brand-500/[6%] hover:text-brand-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onMenuEdit?.(); onMenuClose?.() }}
                >
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" />
                  </svg>
                  Editar columna
                </button>
                <div className="mx-3 border-t border-neutral-100" />
                <button
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onMenuDelete?.(); onMenuClose?.() }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4" />
                  </svg>
                  Borrar columna
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {filterOpen && (
        <FilterPanel
          availableValues={availableValues}
          value={filterValue}
          onChange={(v) => onFilterChange(sortId, v)}
          onClose={() => setFilterOpen(false)}
          top={filterPos.top}
          left={filterPos.left}
          label={label}
        />
      )}
    </th>
  )
}

// ---------------------------------------------------------------------------
// URLCell
// ---------------------------------------------------------------------------

function URLCell({ url }: { url: string }) {
  if (!url || url === '—') return EMPTY_DASH

  let host = url
  let rest = ''
  try {
    const u = new URL(url)
    host = u.hostname.replace(/^www\./, '')
    rest = (u.pathname + u.search).replace(/\/$/, '')
    if (rest === '/') rest = ''
  } catch { /* not a valid URL */ }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        maxWidth: '100%', fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        fontSize: 12, color: '#5C2472', textDecoration: 'none', overflow: 'hidden',
      }}
    >
      <span style={{ display: 'flex', opacity: 0.55, flexShrink: 0 }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L7.5 3.5" />
          <path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" />
        </svg>
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 500 }}>{host}</span>
        {rest && <span style={{ opacity: 0.55 }}>{rest.length > 28 ? rest.slice(0, 28) + '…' : rest}</span>}
      </span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// MetaCellView
// ---------------------------------------------------------------------------

function MetaCellView({ value, def, editable }: { value: string; def: MetaColumnDef; editable: boolean }) {
  const editCls = editable ? 'cursor-text hover:bg-brand-500/[6%] rounded px-0.5 transition-colors' : ''

  if (!value) return <span className={editCls}>{EMPTY_DASH}</span>

  if (def.type === 'url') return <URLCell url={value} />

  if (def.type === 'date') {
    const fmt = (() => {
      try { return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) }
      catch { return value }
    })()
    return <span className={`text-[12px] text-ink/55 ${editCls}`}>{fmt}</span>
  }

  if (def.type === 'boolean') {
    if (value === 'true') return <span className={editCls}><span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-sm text-[12px] font-medium" style={{ backgroundColor: '#EEFBF5', color: '#067647' }}><span className="w-[5px] h-[5px] rounded-full bg-[#10b981]" />Sí</span></span>
    if (value === 'false') return <span className={editCls}><span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-sm text-[12px] font-medium bg-ink/[6%] text-ink/50"><span className="w-[5px] h-[5px] rounded-full bg-ink/30" />No</span></span>
    return <span className={editCls}>{EMPTY_DASH}</span>
  }

  if (def.type === 'list') {
    const opt = (def.options as ListOption[] | undefined)?.find((o) => o.label === value)
    const color = opt?.color
    return (
      <span className={editCls}>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-sm text-[12px] font-medium whitespace-nowrap${!color ? ' bg-brand-500/10 text-brand-600' : ''}`}
          style={color ? { backgroundColor: `${color}1a`, color } : undefined}
        >
          <span
            className={`w-[5px] h-[5px] rounded-full shrink-0${!color ? ' bg-brand-500' : ''}`}
            style={color ? { backgroundColor: color } : undefined}
          />
          {value}
        </span>
      </span>
    )
  }

  if (def.type === 'priority') {
    const level = PRIORITY_LEVELS.find((l) => l.label === value)
    const color = level?.color ?? '#94a3b8'
    return (
      <span className={editCls}>
        <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-sm text-[12px] font-medium whitespace-nowrap"
          style={{ backgroundColor: `${color}1a`, color }}>
          <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: color }} />
          {value}
        </span>
      </span>
    )
  }

  if (def.type === 'number') {
    const num = parseFloat(value)
    const formatted = isNaN(num) ? value : num.toLocaleString('es-MX')
    return <span className={`font-mono tabular-nums text-[13px] text-ink/70 ${editCls}`}>{formatted}</span>
  }

  return <span className={`text-[13px] text-ink ${editCls}`}>{value}</span>
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CatalogGrid<T extends { id: string }>({
  eyebrow,
  title,
  addLabel,
  searchPlaceholder,
  entityLabel,
  rows,
  columns,
  getKey,
  onRowClick,
  canWrite,
  onAdd,
  addRowCells,
  addRowActions,
  metaColumnDefs,
  getMeta,
  onAddColumn,
  onDeleteColumn,
  onEditColumn,
  canModifyColumn,
  onEditMetaCell,
  addRowMetaValues,
  onAddRowMetaChange,
  onDeleteRows,
  onAddRowSave,
  search,
  onSearch,
}: CatalogGridProps<T>) {
  const { openSidebar } = useSidebar()

  const PAGE_SIZE = 100

  const [editingCell, setEditingCell] = useState<{ rowKey: string; colKey: string; value: string } | null>(null)
  const [editingCellPos, setEditingCellPos] = useState({ top: 0, left: 0 })
  const [page, setPage] = useState(0)
  const addRowRef = useRef<HTMLTableRowElement>(null)
  const onAddRowSaveRef = useRef<(() => void) | undefined>(undefined)
  onAddRowSaveRef.current = onAddRowSave
  const isSavingRef = useRef(false)

  const formOpen = !!addRowCells
  useEffect(() => {
    if (!formOpen) { isSavingRef.current = false; return }
    const handler = (e: MouseEvent) => {
      if (!onAddRowSaveRef.current || isSavingRef.current) return
      const target = e.target as Node
      if (addRowRef.current?.contains(target)) return
      if ([...document.querySelectorAll('[data-portal]')].some((p) => p.contains(target))) return
      isSavingRef.current = true
      Promise.resolve(onAddRowSaveRef.current()).finally(() => { isSavingRef.current = false })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [formOpen])
  const [openColMenu, setOpenColMenu] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [headerHovered, setHeaderHovered] = useState(false)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<Record<string, string | string[] | null>>({})

  const handleSort = (id: string) => {
    if (sortField !== id) { setSortField(id); setSortDir('asc'); return }
    if (sortDir === 'asc') { setSortDir('desc'); return }
    setSortField(null); setSortDir('asc')
  }

  const handleFilterChange = (id: string, v: string | string[] | null) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (v == null || (Array.isArray(v) && !v.length)) delete next[id]
      else next[id] = v
      return next
    })
  }

  const filterOptions = useMemo(() => {
    const result: Record<string, string[]> = {}
    metaColumnDefs?.forEach((def) => {
      if (def.type === 'list' && def.options?.length) {
        result[def.key] = def.options.map((o) => o.label)
      } else if (def.type === 'priority') {
        result[def.key] = PRIORITY_LEVELS.map((l) => l.label)
      } else {
        const vals = [...new Set(rows.map((r) => String(getMeta?.(r)?.[def.key] ?? '')).filter(Boolean))]
        result[def.key] = vals.slice(0, 30)
      }
    })
    columns.forEach((col, i) => {
      const id = `__col_${i}`
      if (col.selectOptions) {
        result[id] = col.selectOptions.map((o) => o.label)
      } else {
        const vals = [...new Set(rows.map((r) => String(col.getValue?.(r) ?? '')).filter(Boolean))]
        result[id] = vals.slice(0, 30)
      }
    })
    return result
  }, [rows, metaColumnDefs, columns, getMeta])

  const displayedRows = useMemo(() => {
    let r = [...rows]

    Object.entries(filters).forEach(([id, val]) => {
      if (!val || (Array.isArray(val) && !val.length)) return
      r = r.filter((row) => {
        let cellVal: string
        if (id.startsWith('__col_')) {
          const idx = parseInt(id.replace('__col_', ''))
          const col = columns[idx]
          const raw = String(col?.getValue?.(row) ?? '')
          if (col?.selectOptions) {
            const labels = raw.split(',').filter(Boolean)
              .map((v) => col.selectOptions!.find((o) => o.value === v)?.label ?? v)
            cellVal = labels.join(',')
          } else {
            cellVal = raw
          }
        } else {
          cellVal = String(getMeta?.(row)?.[id] ?? '')
        }
        if (Array.isArray(val)) {
          const cells = cellVal.split(',').filter(Boolean)
          return val.some((v) => cells.includes(v))
        }
        return cellVal.toLowerCase().includes(val.toLowerCase())
      })
    })

    if (sortField) {
      const isPriority = metaColumnDefs?.find((d) => d.key === sortField)?.type === 'priority'
      r.sort((a, b) => {
        let av: string, bv: string
        if (sortField.startsWith('__col_')) {
          const idx = parseInt(sortField.replace('__col_', ''))
          av = String(columns[idx]?.getValue?.(a) ?? '')
          bv = String(columns[idx]?.getValue?.(b) ?? '')
        } else {
          av = String(getMeta?.(a)?.[sortField] ?? '')
          bv = String(getMeta?.(b)?.[sortField] ?? '')
        }
        let cmp: number
        if (isPriority) {
          const ai = PRIORITY_LEVELS.findIndex((l) => l.label === av)
          const bi = PRIORITY_LEVELS.findIndex((l) => l.label === bv)
          cmp = (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        } else {
          cmp = av.localeCompare(bv, 'es', { numeric: true })
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return r
  }, [rows, filters, sortField, sortDir, columns, getMeta, metaColumnDefs])

  const activeFilterCount = Object.values(filters).filter((v) => v != null && (Array.isArray(v) ? v.length > 0 : v.length > 0)).length

  useEffect(() => { setPage(0) }, [filters, sortField, sortDir, search])

  const totalRegistros = useMemo(() => {
    let sum = 0
    displayedRows.forEach((row) => {
      const v = getMeta?.(row)?.registros
      const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
      if (!isNaN(n)) sum += n
    })
    return sum
  }, [displayedRows, getMeta])

  const pagedRows = displayedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(displayedRows.length / PAGE_SIZE))

  const toggleSelectAll = () => {
    setSelectedRows(selectedRows.size === pagedRows.length && pagedRows.length > 0
      ? new Set()
      : new Set(pagedRows.map(getKey)))
  }
  const toggleSelectRow = (key: string) => {
    setSelectedRows((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  const totalCols = 1 + columns.length + (metaColumnDefs?.length ?? 0) + (onAddColumn ? 1 : 0) + 1

  const exportToCsv = () => {
    const escape = (v: unknown) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }
    const resolveColValue = (col: Column<T>, row: T): string => {
      const raw = col.getValue?.(row) ?? ''
      if (col.selectOptions?.length) {
        const labels = raw.split(',').filter(Boolean)
          .map((id) => col.selectOptions!.find((o) => o.value === id)?.label ?? id)
        return labels.join(', ')
      }
      return raw
    }
    const headers = [
      ...columns.map((c) => escape(c.header)),
      ...(metaColumnDefs ?? []).map((d) => escape(d.label ?? d.key)),
    ]
    const rowLines = displayedRows.map((row) => [
      ...columns.map((c) => escape(resolveColValue(c, row))),
      ...(metaColumnDefs ?? []).map((d) => escape(getMeta?.(row)?.[d.key] ?? '')),
    ].join(','))
    const csv = [headers.join(','), ...rowLines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Editorial header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: SECTION_LABEL_COLOR }}>
          {eyebrow}
        </p>
        <h1 className="text-ink leading-none" style={{ fontFamily: '"Newsreader", "EB Garamond", Georgia, serif', fontSize: '32px', fontWeight: 500 }}>
          {title}
          <span style={{ color: SECTION_LABEL_COLOR, fontSize: '22px', fontWeight: 400, marginLeft: '12px' }}>
            {displayedRows.length} resultados
          </span>
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={openSidebar}
          className="md:hidden p-1.5 rounded-md text-ink/40 hover:text-ink hover:bg-ink/[5%] transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>

        <div className="relative w-64">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder ?? `Buscar ${entityLabel}…`}
            className="w-full h-8 pl-8 pr-3 text-[13px] text-ink bg-white border border-ink/[10%] rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 placeholder-ink/30"
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({})}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-brand-600 bg-brand-500/[8%] rounded-md hover:bg-brand-500/[12%] transition-colors"
          >
            {FILTER_ICON}
            {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} · Limpiar
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportToCsv}
            title="Exportar a CSV"
            className="h-8 px-3 rounded-md text-[13px] font-medium bg-ink/[8%] text-ink/70 hover:bg-accent hover:text-white transition-all duration-300 inline-flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1v8M4 6l3 3 3-3" />
              <path d="M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" />
            </svg>
            CSV
          </button>
          {canWrite && onAdd && (
            <button
              onClick={onAdd}
              className="h-8 px-4 rounded-md text-[13px] font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors inline-flex items-center gap-1.5"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-lg border border-ink/[10%] shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto" style={{ maxHeight: '560px', overflowY: 'auto' }}>
          <table className="border-collapse text-[13px]" style={{ tableLayout: 'fixed', width: '100%', minWidth: totalCols * 320 }}>
            <thead>
              <tr onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)}>
                <th
                  className="border-r border-ink/[5%]"
                  style={{
                    position: 'sticky', top: 0, zIndex: 3,
                    backgroundColor: '#FBFAFC',
                    borderBottom: '1px solid rgba(26,22,37,.10)',
                    width: 40, minWidth: 40, height: 36,
                    padding: '0 8px', verticalAlign: 'middle', textAlign: 'center',
                  }}
                >
                  {headerHovered ? (
                    <input
                      type="checkbox"
                      checked={selectedRows.size === pagedRows.length && pagedRows.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-brand-600 cursor-pointer"
                      aria-label="Seleccionar todos"
                    />
                  ) : (
                    <span className="font-mono text-[10px] text-ink/30 select-none">#</span>
                  )}
                </th>

                {columns.map((col, i) => (
                  <GridColHeader
                    key={i}
                    label={col.header}
                    icon={col.icon}
                    typeKey="text"
                    sortField={sortField}
                    sortId={`__col_${i}`}
                    sortDir={sortDir}
                    onSort={handleSort}
                    filterValue={filters[`__col_${i}`] ?? null}
                    onFilterChange={handleFilterChange}
                    availableValues={filterOptions[`__col_${i}`] ?? []}
                  />
                ))}

                {metaColumnDefs?.map((def) => (
                  <GridColHeader
                    key={def.key}
                    label={def.label ?? def.key}
                    typeKey={def.type === 'list' ? 'tag' : def.type}
                    sortField={sortField}
                    sortId={def.key}
                    sortDir={sortDir}
                    onSort={handleSort}
                    filterValue={filters[def.key] ?? null}
                    onFilterChange={handleFilterChange}
                    availableValues={filterOptions[def.key] ?? []}
                    hasMenu={!!(onDeleteColumn || onEditColumn) && (!canModifyColumn || canModifyColumn(def))}
                    menuOpen={openColMenu === def.key}
                    onMenuOpen={() => setOpenColMenu(def.key)}
                    onMenuClose={() => setOpenColMenu(null)}
                    onMenuDelete={() => onDeleteColumn?.(def.key)}
                    onMenuEdit={() => onEditColumn?.(def)}
                  />
                ))}

                {onAddColumn && (
                  <th style={{
                    position: 'sticky', top: 0, zIndex: 2,
                    backgroundColor: '#FBFAFC',
                    borderBottom: '1px solid rgba(26,22,37,.10)',
                    width: 44, height: 36, verticalAlign: 'middle', textAlign: 'center', padding: 0,
                  }}>
                    <button
                      onClick={onAddColumn}
                      className="w-6 h-6 rounded flex items-center justify-center text-ink/30 hover:text-brand-600 hover:bg-brand-500/10 transition-all duration-150 mx-auto"
                      title="Agregar campo"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M7 1v12M1 7h12" />
                      </svg>
                    </button>
                  </th>
                )}

                <th style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: '#FBFAFC', borderBottom: '1px solid rgba(26,22,37,.10)', width: 44, minWidth: 44 }} />
              </tr>
            </thead>

            <tbody>
              {displayedRows.length === 0 && !addRowCells && (
                <tr>
                  <td colSpan={totalCols} className="px-6 py-14 text-center">
                    <svg className="mx-auto mb-3 text-ink/[12%]" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2h7.5L22 8.5V24a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2z" />
                      <path d="M15.5 2v7H22M10 14h8M10 18h6" />
                    </svg>
                    <p className="text-sm text-ink/40">Sin registros</p>
                  </td>
                </tr>
              )}

              {pagedRows.map((row, rowIndex) => {
                const rowKey = getKey(row)
                const isSelected = selectedRows.has(rowKey)
                const isHovered = hoveredRow === rowKey

                return (
                  <tr
                    key={rowKey}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ background: isSelected ? '#FAF3FF' : isHovered ? '#FAF8FC' : '#fff' }}
                  >
                    <td
                      className="border-r border-ink/[5%]"
                      style={{ width: 40, height: 40, verticalAlign: 'middle', textAlign: 'center', padding: '0 8px', borderBottom: '1px solid rgba(26,22,37,.05)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isHovered || isSelected ? (
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectRow(rowKey)}
                          aria-label={`Seleccionar fila ${page * PAGE_SIZE + rowIndex + 1}`}
                          className="w-3.5 h-3.5 rounded accent-brand-600 cursor-pointer" />
                      ) : (
                        <span aria-hidden="true" className="font-mono text-[10px] text-ink/30 select-none">{page * PAGE_SIZE + rowIndex + 1}</span>
                      )}
                    </td>

                    {columns.map((col, ci) => {
                      const colKey = `__col_${ci}`
                      const isEditingThis = !!col.onEdit && editingCell?.rowKey === rowKey && editingCell?.colKey === colKey
                      const isMultiSelect = col.multiple && !!col.selectOptions
                      const cellCtx = { rowIndex: page * PAGE_SIZE + rowIndex, columnName: col.header }
                      return (
                        <td
                          key={ci}
                          className="border-r border-ink/[5%] px-2.5"
                          style={{
                            height: 40, verticalAlign: 'middle',
                            borderBottom: '1px solid rgba(26,22,37,.05)',
                            overflow: isEditingThis && isMultiSelect ? 'visible' : 'hidden',
                            position: 'relative',
                          }}
                          onClick={col.onEdit && canWrite ? (e) => {
                            e.stopPropagation()
                            if (!isEditingThis) {
                              const rect = (e.currentTarget as HTMLTableCellElement).getBoundingClientRect()
                              setEditingCellPos({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 268) })
                              setEditingCell({ rowKey, colKey, value: col.getValue?.(row) ?? '' })
                            }
                          } : undefined}
                        >
                          <CellContext.Provider value={cellCtx}>
                          {isEditingThis && isMultiSelect ? (
                            <>
                              <span className="block truncate">{col.render(row, rowIndex, col.header)}</span>
                              <MultiSelectPanel
                                options={col.selectOptions!}
                                value={editingCell!.value}
                                onChange={(v) => setEditingCell((p) => p ? { ...p, value: v } : null)}
                                onClose={() => { col.onEdit?.(row, editingCell!.value); setEditingCell(null) }}
                                top={editingCellPos.top}
                                left={editingCellPos.left}
                              />
                            </>
                          ) : isEditingThis && col.selectOptions ? (
                            <>
                              <span className="block truncate">{col.render(row, rowIndex, col.header)}</span>
                              <SingleSelectPanel
                                options={col.selectOptions}
                                value={editingCell!.value}
                                onChange={(v) => col.onEdit?.(row, v)}
                                onClose={() => setEditingCell(null)}
                                top={editingCellPos.top}
                                left={editingCellPos.left}
                                label={col.header}
                              />
                            </>
                          ) : isEditingThis && col.inputType === 'date' ? (
                            <>
                              <span className="block truncate">{col.render(row, rowIndex, col.header)}</span>
                              <DatePickerPanel
                                value={editingCell!.value}
                                onChange={(v) => { col.onEdit?.(row, v); setEditingCell(null) }}
                                onClose={() => setEditingCell(null)}
                                top={editingCellPos.top}
                                left={editingCellPos.left}
                              />
                            </>
                          ) : isEditingThis && col.inputType === 'json' ? (
                            <>
                              <span className="block truncate">{col.render(row, rowIndex, col.header)}</span>
                              <JsonEditorPanel
                                value={(() => { try { return JSON.parse(editingCell!.value) } catch { return {} } })()}
                                onChange={(v) => { col.onEdit?.(row, JSON.stringify(v)); setEditingCell(null) }}
                                onClose={() => setEditingCell(null)}
                                top={editingCellPos.top}
                                left={editingCellPos.left}
                                label={col.header}
                              />
                            </>
                          ) : isEditingThis ? (
                            <input
                              autoFocus value={editingCell!.value}
                              onChange={(e) => setEditingCell((p) => p ? { ...p, value: e.target.value } : null)}
                              onBlur={() => { col.onEdit?.(row, editingCell!.value); setEditingCell(null) }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { col.onEdit?.(row, editingCell!.value); setEditingCell(null) }
                                if (e.key === 'Escape') setEditingCell(null)
                              }}
                              className={INLINE_INPUT_CLS}
                              onClick={(e) => e.stopPropagation()} />
                          ) : (
                            <span className={col.onEdit && canWrite ? 'cursor-pointer hover:bg-brand-500/[6%] rounded px-0.5 transition-colors block truncate' : 'block truncate'}>
                              {col.render(row, rowIndex, col.header)}
                            </span>
                          )}
                          </CellContext.Provider>
                        </td>
                      )
                    })}

                    {metaColumnDefs?.map((def) => {
                      const isEditingThis = editingCell?.rowKey === rowKey && editingCell?.colKey === def.key
                      const rawVal = getMeta?.(row)?.[def.key]
                      const currentVal = rawVal != null ? String(rawVal) : ''
                      return (
                        <td
                          key={def.key}
                          className="border-r border-ink/[5%] px-2.5"
                          style={{ height: 40, verticalAlign: 'middle', borderBottom: '1px solid rgba(26,22,37,.05)', overflow: 'hidden' }}
                          onClick={onEditMetaCell && canWrite ? (e) => {
                            e.stopPropagation()
                            const rect = (e.currentTarget as HTMLTableCellElement).getBoundingClientRect()
                            setEditingCellPos({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 268) })
                            setEditingCell({ rowKey, colKey: def.key, value: currentVal })
                          } : undefined}
                        >
                          {isEditingThis ? (
                            def.type === 'boolean' ? (
                              <>
                                <MetaCellView value={currentVal} def={def} editable={false} />
                                <SingleSelectPanel
                                  options={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
                                  value={editingCell!.value}
                                  onChange={(v) => onEditMetaCell?.(row, def.key, v)}
                                  onClose={() => setEditingCell(null)}
                                  top={editingCellPos.top}
                                  left={editingCellPos.left}
                                  label={def.label ?? def.key}
                                />
                              </>
                            ) : def.type === 'list' && def.options?.length ? (
                              <>
                                <MetaCellView value={currentVal} def={def} editable={false} />
                                <SingleSelectPanel
                                  options={def.options.map((o) => ({ value: o.label, label: o.label }))}
                                  value={editingCell!.value}
                                  onChange={(v) => onEditMetaCell?.(row, def.key, v)}
                                  onClose={() => setEditingCell(null)}
                                  top={editingCellPos.top}
                                  left={editingCellPos.left}
                                  label={def.label ?? def.key}
                                />
                              </>
                            ) : def.type === 'priority' ? (
                              <>
                                <MetaCellView value={currentVal} def={def} editable={false} />
                                <SingleSelectPanel
                                  options={PRIORITY_LEVELS.map((l) => ({ value: l.label, label: l.label }))}
                                  value={editingCell!.value}
                                  onChange={(v) => onEditMetaCell?.(row, def.key, v)}
                                  onClose={() => setEditingCell(null)}
                                  top={editingCellPos.top}
                                  left={editingCellPos.left}
                                  label={def.label ?? def.key}
                                />
                              </>
                            ) : (
                              <input autoFocus type={def.type === 'date' ? 'date' : 'text'}
                                value={editingCell!.value}
                                onChange={(e) => setEditingCell((p) => p ? { ...p, value: e.target.value } : null)}
                                onBlur={() => { onEditMetaCell?.(row, def.key, editingCell!.value); setEditingCell(null) }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { onEditMetaCell?.(row, def.key, editingCell!.value); setEditingCell(null) }
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                                className={INLINE_INPUT_CLS} onClick={(e) => e.stopPropagation()} />
                            )
                          ) : (
                            <MetaCellView value={currentVal} def={def} editable={!!onEditMetaCell && !!canWrite} />
                          )}
                        </td>
                      )
                    })}

                    {onAddColumn && <td style={{ borderBottom: '1px solid rgba(26,22,37,.05)' }} />}

                    <td
                      style={{ width: 44, height: 40, verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid rgba(26,22,37,.05)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isHovered && onRowClick && (
                        <button
                          onClick={() => onRowClick(row)}
                          className="w-6 h-6 rounded flex items-center justify-center text-ink/30 hover:text-ink/60 hover:bg-ink/[5%] transition-all mx-auto"
                          title="Abrir"
                        >
                          {EYE_ICON}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}

              {addRowCells && (
                <tr
                  ref={addRowRef}
                  style={{ background: 'rgba(110,37,139,.02)' }}
                  onKeyDown={(e) => {
                    const tag = (e.target as HTMLElement).tagName
                    if (e.key === 'Enter' && !isSavingRef.current && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
                      isSavingRef.current = true
                      Promise.resolve(onAddRowSaveRef.current?.()).finally(() => { isSavingRef.current = false })
                    }
                  }}
                >
                  <td style={{ height: 40, verticalAlign: 'middle', textAlign: 'center', padding: '0 6px', borderBottom: '1px solid rgba(26,22,37,.05)', borderRight: '1px solid rgba(26,22,37,.05)', whiteSpace: 'nowrap' }}>
                    {addRowActions}
                  </td>
                  {addRowCells}
                  {metaColumnDefs?.map((def) => (
                    <td key={def.key} className="px-2.5 border-r border-ink/[5%]" style={{ height: 40, borderBottom: '1px solid rgba(26,22,37,.05)' }}>
                      {onAddRowMetaChange && (
                        def.type === 'boolean' ? (
                          <SelectInput
                            value={addRowMetaValues?.[def.key] ?? ''}
                            onChange={(v) => onAddRowMetaChange(def.key, v)}
                            options={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
                            label={def.label ?? def.key}
                          />
                        ) : def.type === 'list' && def.options?.length ? (
                          <SelectInput
                            value={addRowMetaValues?.[def.key] ?? ''}
                            onChange={(v) => onAddRowMetaChange(def.key, v)}
                            options={def.options.map((o) => ({ value: o.label, label: o.label }))}
                            label={def.label ?? def.key}
                          />
                        ) : def.type === 'priority' ? (
                          <SelectInput
                            value={addRowMetaValues?.[def.key] ?? ''}
                            onChange={(v) => onAddRowMetaChange(def.key, v)}
                            options={PRIORITY_LEVELS.map((l) => ({ value: l.label, label: l.label }))}
                            label={def.label ?? def.key}
                          />
                        ) : (
                          <input type={def.type === 'date' ? 'date' : 'text'}
                            value={addRowMetaValues?.[def.key] ?? ''}
                            onChange={(e) => onAddRowMetaChange(def.key, e.target.value)}
                            placeholder={(def.label ?? def.key) + '…'}
                            className="w-full px-2 py-1 text-[13px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-ink/30" />
                        )
                      )}
                    </td>
                  ))}
                  {onAddColumn && <td style={{ borderBottom: '1px solid rgba(26,22,37,.05)' }} />}
                  <td style={{ borderBottom: '1px solid rgba(26,22,37,.05)' }} />
                </tr>
              )}

              {!addRowCells && canWrite && onAdd && (
                <tr className="hover:bg-brand-500/[2%] transition-colors" style={{ background: '#fff' }}>
                  <td colSpan={totalCols} className="px-3 py-2.5">
                    <button
                      onClick={onAdd}
                      className="flex items-center gap-1.5 text-[12px] text-ink/60 hover:text-brand-600 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M6 1v10M1 6h10" />
                      </svg>
                      {addLabel}…
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-ink/[6%]" style={{ backgroundColor: '#FBFAFC' }}>
          <span className="font-mono text-[11px] text-ink/70">
            <strong className="font-semibold text-ink">{displayedRows.length}</strong> {displayedRows.length === 1 ? 'fila' : 'filas'}
          </span>
          {totalRegistros > 0 && (
            <>
              <span className="font-mono text-[11px] text-ink/25">·</span>
              <span className="font-mono text-[11px] text-ink/70">
                Total registros: <strong className="font-semibold text-ink">{totalRegistros.toLocaleString('es-MX')}</strong>
              </span>
            </>
          )}
          {selectedRows.size > 0 && (
            <>
              <span className="font-mono text-[11px] text-ink/25">·</span>
              <span className="font-mono text-[11px] text-brand-600 font-medium">
                {selectedRows.size} seleccionada{selectedRows.size !== 1 ? 's' : ''}
              </span>
            </>
          )}
          {selectedRows.size > 0 && onDeleteRows && (
            <button
              onClick={() => { onDeleteRows([...selectedRows]); setSelectedRows(new Set()) }}
              className="flex items-center gap-1.5 text-[11px] text-red-400 hover:text-red-500 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4" />
              </svg>
              Eliminar seleccionadas
            </button>
          )}

          {totalPages > 1 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[11px] text-ink/40">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, displayedRows.length)} de {displayedRows.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-6 h-6 rounded flex items-center justify-center text-ink/40 hover:text-ink hover:bg-ink/[6%] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Página anterior"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.5 2.5L4.5 6l3 3.5" />
                </svg>
              </button>
              <span className="font-mono text-[11px] text-ink/70">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-6 h-6 rounded flex items-center justify-center text-ink/40 hover:text-ink hover:bg-ink/[6%] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                aria-label="Página siguiente"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 2.5L7.5 6l-3 3.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
