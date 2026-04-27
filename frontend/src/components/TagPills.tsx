import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { LIST_COLOR_PALETTE } from '@/hooks/useMetaColumns'

interface TagPillsProps {
  items: string[]
  label?: string
  maxVisible?: number
}

export default function TagPills({ items, label = 'ELEMENTOS', maxVisible = 2 }: TagPillsProps) {
  const [hovered, setHovered] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  const scheduleHide = () => {
    clearHide()
    hideTimer.current = setTimeout(() => setHovered(false), 120)
  }

  const handleTriggerEnter = useCallback(() => {
    clearHide()
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: Math.min(r.left + window.scrollX, window.innerWidth + window.scrollX - 208) })
    }
    setHovered(true)
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(items.join(', ')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [items])

  if (!items.length) return <span className="font-mono text-ink/[30%] text-[13px] select-none">—</span>

  const visible = items.slice(0, maxVisible)
  const overflow = items.length - maxVisible

  return (
    <div
      ref={ref}
      className="inline-flex items-center gap-1"
      onMouseEnter={handleTriggerEnter}
      onMouseLeave={scheduleHide}
    >
      {visible.map((item, i) => {
        const color = LIST_COLOR_PALETTE[i % LIST_COLOR_PALETTE.length]
        return (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-sm text-[12px] font-medium whitespace-nowrap"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: color }} />
            {item}
          </span>
        )
      })}

      {overflow > 0 && (
        <span className="inline-flex items-center px-1.5 py-[2px] rounded-sm text-[11px] font-medium text-ink/50 bg-ink/[5%]">
          +{overflow}
        </span>
      )}

      {hovered && createPortal(
        <div
          data-portal
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-ink/[10%] rounded-lg shadow-lg shadow-ink/[8%] p-4 min-w-[200px]"
          onMouseEnter={clearHide}
          onMouseLeave={scheduleHide}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
              {label} · {items.length}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy() }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors duration-150 text-ink/40 hover:text-ink/70 hover:bg-ink/[5%]"
              title="Copiar lista"
            >
              {copied ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.5 6L4.5 9 10.5 3" />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="7" height="7" rx="1" />
                    <path d="M4 3H3a1 1 0 00-1 1v6" />
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => {
              const color = LIST_COLOR_PALETTE[i % LIST_COLOR_PALETTE.length]
              return (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-sm text-[12px] font-medium whitespace-nowrap"
                  style={{ backgroundColor: `${color}1a`, color }}
                >
                  <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {item}
                </span>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
