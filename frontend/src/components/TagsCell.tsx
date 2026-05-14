import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TagsCellProps {
  value: unknown[] | null | undefined
}

const CARD_WIDTH = 360

export function TagsCell({ value }: TagsCellProps) {
  const tags = (value ?? []).map(String)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; above: boolean } | null>(null)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])

  const cancelTimers = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [])

  const scheduleHide = useCallback(() => {
    if (showTimer.current) clearTimeout(showTimer.current)
    hideTimer.current = setTimeout(() => setTooltipPos(null), 250)
  }, [])

  const handleMouseEnter = useCallback(() => {
    cancelTimers()
    if (!tags.length) return
    showTimer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const showAbove = rect.bottom + 200 > window.innerHeight
      const top = showAbove ? rect.top - 8 : rect.bottom + 8
      const left = Math.min(rect.left, window.innerWidth - CARD_WIDTH - 16)
      setTooltipPos({ top, left: Math.max(8, left), above: showAbove })
    }, 300)
  }, [cancelTimers, tags.length])

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!tags.length) return
    navigator.clipboard.writeText(tags.join(', '))
    setCopied(true)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1200)
  }, [tags])

  if (!tags.length) return <span className="text-ink/30 text-[13px]">--</span>

  return (
    <>
      <div
        ref={ref}
        className="flex flex-wrap gap-1 overflow-hidden max-h-[40px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={scheduleHide}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-brand-500/10 text-brand-700 max-w-[140px] truncate"
          >
            {tag}
          </span>
        ))}
      </div>
      {tooltipPos && createPortal(
        <div
          className="fixed z-[9999] rounded-xl border border-ink/8 bg-white shadow-xl"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: CARD_WIDTH,
            transform: tooltipPos.above ? 'translateY(-100%)' : undefined,
          }}
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current) }}
          onMouseLeave={scheduleHide}
        >
          <div className="px-5 pt-5 pb-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-[13px] font-medium bg-brand-500/10 text-brand-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-end border-t border-ink/5 px-5 py-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[13px] text-ink/35 transition-colors hover:text-brand-600"
            >
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 7 5.5 10.5 12 4" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="8" height="8" rx="1" />
                  <path d="M2 10V3a1 1 0 0 1 1-1h7" />
                </svg>
              )}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
