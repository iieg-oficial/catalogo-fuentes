import { useState, useRef } from 'react'
import DatePickerPanel from '@/components/DatePickerPanel'

interface DatePickerInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150 cursor-pointer'

function fmtDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DatePickerInput({ value, onChange, placeholder = 'Fecha...', onKeyDown }: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const handleClick = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(true)
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        onKeyDown={onKeyDown}
        className={`${inputCls} text-left ${value ? 'text-ink/80' : 'text-neutral-300'}`}
      >
        {value ? fmtDisplay(value) : placeholder}
      </button>
      {open && (
        <DatePickerPanel
          value={value}
          onChange={(v) => { onChange(v); setOpen(false) }}
          onClose={() => setOpen(false)}
          top={pos.top}
          left={pos.left}
        />
      )}
    </>
  )
}
