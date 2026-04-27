import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SingleSelectPanelProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  onClose: () => void
  top: number
  left: number
  label?: string
}

export default function SingleSelectPanel({ options, value, onChange, onClose, top, left, label }: SingleSelectPanelProps) {
  const ref = useRef<HTMLDivElement>(null)

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

  return createPortal(
    <div
      ref={ref}
      data-portal
      style={{ position: 'fixed', top, left, zIndex: 9999 }}
      className="bg-white rounded-xl border border-ink/[10%] shadow-xl shadow-ink/[6%] min-w-[200px] max-w-[260px] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {label && (
        <div className="px-3 py-2.5 border-b border-ink/[6%]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{label}</p>
        </div>
      )}
      <div className="py-1.5 max-h-52 overflow-y-auto">
        <button
          type="button"
          onClick={() => { onChange(''); onClose() }}
          className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors duration-100 ${
            !value ? 'text-brand-700 bg-brand-500/[5%]' : 'text-ink/50 hover:bg-ink/[3%]'
          }`}
        >
          <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-100 ${
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
              onClick={() => { onChange(opt.value); onClose() }}
              className={`w-full flex items-center gap-2.5 px-3 py-[7px] text-[13px] text-left transition-colors duration-100 ${
                isSelected ? 'text-brand-700 bg-brand-500/[5%]' : 'text-ink/70 hover:bg-ink/[3%]'
              }`}
            >
              <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-100 ${
                isSelected ? 'bg-brand-600 border-brand-600' : 'border-ink/[18%] bg-white'
              }`}>
                {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              {opt.label}
            </button>
          )
        })}
        {options.length === 0 && <p className="px-3 py-2.5 text-[12px] text-ink/40">Sin opciones disponibles</p>}
      </div>
    </div>,
    document.body,
  )
}
