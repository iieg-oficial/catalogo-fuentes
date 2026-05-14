import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
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

export default function DatePickerPanel({ value, onChange, onClose, top, left }: DatePickerPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [month, setMonth] = useState<Date>(() => toDate(value) ?? new Date())

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

  const selected = toDate(value)

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
          caption_label: 'rdp-caption-label',
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
