import { useState, useRef } from 'react'
import JsonEditorPanel from '@/components/JsonEditorPanel'

interface JsonEditorInputProps {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  placeholder?: string
  label?: string
}

const inputCls = 'w-full px-2.5 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-400 bg-white placeholder-neutral-300 transition-colors duration-150 cursor-pointer'

export default function JsonEditorInput({ value, onChange, placeholder = 'JSON...', label }: JsonEditorInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const keys = Object.keys(value)
  const hasData = keys.length > 0

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
        className={`${inputCls} text-left ${hasData ? 'text-ink/80' : 'text-neutral-300'}`}
      >
        {hasData
          ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[11px] font-medium bg-amber-500/10 text-amber-700">{keys.length} {keys.length === 1 ? 'campo' : 'campos'}</span>
          : placeholder}
      </button>
      {open && (
        <JsonEditorPanel
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          top={pos.top}
          left={pos.left}
          label={label}
        />
      )}
    </>
  )
}
