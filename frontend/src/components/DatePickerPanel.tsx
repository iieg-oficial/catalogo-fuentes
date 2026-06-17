import { useRef, useEffect, useState, type ChangeEvent, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker, type DropdownProps } from 'react-day-picker'
import { es } from 'react-day-picker/locale'

interface DatePickerPanelProps {
  value: string
  onChange: (v: string) => void
  onClose: () => void
  top: number
  left: number
}

function toDate(iso: string): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const chevron = (
  <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 4l3 3 3-3" />
  </svg>
)

/**
 * Reemplaza el `<select>` nativo de react-day-picker por un menú propio,
 * consistente con el resto de selects de la app (panel blanco, acento de marca, check).
 * Permite saltar de mes/año directamente sin navegar flecha por flecha.
 */
function CaptionDropdown({ options = [], value, onChange, ['aria-label']: ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const current = options.find((o) => String(o.value) === String(value))

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const menuH = 232
      const flipUp = r.bottom + 6 + menuH > window.innerHeight
      setPos({
        position: 'fixed',
        top: flipUp ? Math.max(8, r.top - 6 - menuH) : r.bottom + 6,
        left: r.left,
        minWidth: Math.max(r.width, 120),
        zIndex: 10000,
      })
    }
    setOpen((o) => !o)
  }

  const pick = (v: number) => {
    onChange?.({ target: { value: String(v) } } as unknown as ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <span className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[14px] font-semibold text-ink capitalize
                   hover:bg-brand-100 transition-colors duration-100
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
      >
        {current?.label}
        <span className="text-brand-600">{chevron}</span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          data-rdp-menu
          style={pos}
          className="bg-white border border-ink/[10%] rounded-xl shadow-xl shadow-ink/[10%] py-1 max-h-[232px] overflow-y-auto"
        >
          {options.map((opt) => {
            const isSel = String(opt.value) === String(value)
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSel}
                disabled={opt.disabled}
                ref={isSel ? (el) => el?.scrollIntoView({ block: 'center' }) : undefined}
                onClick={() => pick(opt.value)}
                className={`w-full flex items-center justify-between gap-3 pl-3 pr-2.5 py-[6px] text-[13px] text-left capitalize transition-colors duration-100 disabled:opacity-30 disabled:cursor-not-allowed ${
                  isSel ? 'text-brand-700 font-semibold bg-brand-500/[6%]' : 'text-ink/70 hover:bg-ink/[3%]'
                }`}
              >
                {opt.label}
                {isSel && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2 6.5L4.5 9 10 3" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </span>
  )
}

export default function DatePickerPanel({ value, onChange, onClose, top, left }: DatePickerPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [month, setMonth] = useState<Date>(() => toDate(value) ?? new Date())

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Los menús de mes/año viven en un portal fuera del panel; no cerrar al usarlos.
      if (target.closest('[data-rdp-menu]')) return
      if (ref.current && !ref.current.contains(target)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  const selected = toDate(value)

  // Rango navegable para el selector de año (salto directo de año, sin ir mes a mes).
  const currentYear = new Date().getFullYear()
  const startMonth = new Date(currentYear - 100, 0)
  const endMonth = new Date(currentYear + 10, 11)

  const panelWidth = 300
  const panelHeight = 340
  const adjustedLeft = Math.min(left, window.innerWidth - panelWidth - 8)
  const adjustedTop = top + panelHeight > window.innerHeight
    ? Math.max(8, top - panelHeight - 8)
    : top

  return createPortal(
    <div
      ref={ref}
      data-portal
      style={{ position: 'fixed', top: adjustedTop, left: adjustedLeft, zIndex: 9999 }}
      className="bg-white rounded-xl border border-ink/[10%] shadow-xl shadow-ink/[6%] rdp-panel"
      onClick={(e) => e.stopPropagation()}
    >
      <DayPicker
        mode="single"
        locale={es}
        selected={selected}
        month={month}
        onMonthChange={setMonth}
        captionLayout="dropdown"
        startMonth={startMonth}
        endMonth={endMonth}
        components={{ Dropdown: CaptionDropdown }}
        onSelect={(date) => {
          if (date) {
            onChange(toISO(date))
            onClose()
          }
        }}
        weekStartsOn={1}
        classNames={{
          root: 'rdp-custom',
          months: 'rdp-months',
          month: 'rdp-month',
          month_caption: 'rdp-caption',
          dropdowns: 'rdp-dropdowns',
          nav: 'rdp-nav',
          button_previous: 'rdp-nav-btn',
          button_next: 'rdp-nav-btn',
          month_grid: 'rdp-table',
          weekdays: 'rdp-head-row',
          weekday: 'rdp-head-cell',
          weeks: 'rdp-tbody',
          week: 'rdp-row',
          day: 'rdp-cell',
          day_button: 'rdp-day-btn',
          selected: 'rdp-selected',
          today: 'rdp-today',
          outside: 'rdp-outside',
          chevron: 'rdp-chevron',
        }}
      />
    </div>,
    document.body,
  )
}
