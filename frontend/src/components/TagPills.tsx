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
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX })
    }
    setHovered(true)
  }, [])

  if (!items.length) return <span className="font-mono text-ink/[30%] text-[13px] select-none">—</span>

  const visible = items.slice(0, maxVisible)
  const overflow = items.length - maxVisible

  return (
    <div
      ref={ref}
      className="inline-flex items-center gap-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
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
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-ink/[10%] rounded-lg shadow-lg shadow-ink/[8%] p-4 min-w-[200px]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40 mb-2">
            {label} · {items.length}
          </p>
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
