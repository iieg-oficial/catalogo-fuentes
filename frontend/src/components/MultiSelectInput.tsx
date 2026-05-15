import { useState, useRef, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'

interface MultiSelectInputProps {
  value: string[]
  onChange: (v: string[]) => void
  options: { value: string; label: string }[]
  placeholder?: string
  label?: string
}

function MultiSelectInput({ value, onChange, options, placeholder = 'Seleccionar…', label }: MultiSelectInputProps) {
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

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((id) => id !== v) : [...value, v])
  }

  const displayText = value.length > 0
    ? `${value.length} elemento${value.length !== 1 ? 's' : ''}`
    : placeholder

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full h-full flex items-center gap-1 text-[13px] px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 rounded"
        style={{ color: value.length > 0 ? 'rgba(26,22,37,.87)' : 'rgba(26,22,37,.35)' }}
      >
        <span className="flex-1 truncate text-left">{displayText}</span>
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
                {label}{value.length > 0 ? ` · ${value.length}` : ''}
              </p>
            </div>
          )}
          <div className="py-1.5 max-h-52 overflow-y-auto">
            {options.map((opt) => {
              const isChecked = value.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
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
                  {opt.label}
                </button>
              )
            })}
            {options.length === 0 && (
              <p className="px-3 py-2.5 text-[12px] text-ink/40">Sin opciones disponibles</p>
            )}
          </div>
          <div className="border-t border-ink/[6%] px-2 py-1.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-500/[6%] rounded-md transition-colors"
            >
              Listo
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

export default memo(MultiSelectInput)
