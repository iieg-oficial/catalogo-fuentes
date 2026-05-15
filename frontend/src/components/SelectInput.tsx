import { useState, useRef, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'

interface SelectInputProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  label?: string
}

function SelectInput({ value, onChange, options, placeholder = 'Seleccionar…', label }: SelectInputProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 268) })
    }
    setOpen((v) => !v)
  }

  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full h-full flex items-center gap-1 text-[13px] px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 rounded"
        style={{ color: value ? 'rgba(26,22,37,.87)' : 'rgba(26,22,37,.35)' }}
      >
        <span className="flex-1 truncate text-left">{selectedLabel ?? placeholder}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45, flexShrink: 0 }}>
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          data-portal
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-ink/[10%] rounded-xl shadow-xl shadow-ink/[6%] min-w-[200px] max-w-[260px] overflow-hidden"
        >
          {label && (
            <div className="px-3 py-2.5 border-b border-ink/[6%]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{label}</p>
            </div>
          )}
          <div className="py-1.5 max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors duration-100 ${
                !value ? 'text-brand-700 bg-brand-500/[5%]' : 'text-ink/50 hover:bg-ink/[3%]'
              }`}
            >
              <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                !value ? 'bg-brand-600 border-brand-600' : 'border-ink/[18%] bg-white'
              }`}>
                {!value && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              <span className="italic text-ink/40">—</span>
            </button>
            {options.map((opt) => {
              const isSelected = value === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors duration-100 ${
                    isSelected ? 'text-brand-700 bg-brand-500/[5%]' : 'text-ink/70 hover:bg-ink/[3%]'
                  }`}
                >
                  <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'bg-brand-600 border-brand-600' : 'border-ink/[18%] bg-white'
                  }`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  {opt.label}
                </button>
              )
            })}
            {options.length === 0 && (
              <p className="px-3 py-2.5 text-[12px] text-ink/40">Sin opciones disponibles</p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export default memo(SelectInput)
