import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface TextCellProps {
  value: string | null | undefined
  mono?: boolean
  link?: boolean
}

const CARD_WIDTH = 540

export function TextCell({ value, mono = false, link = false }: TextCellProps) {
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; above: boolean } | null>(null)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
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
    const el = ref.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    showTimer.current = setTimeout(() => {
      const rect = el.getBoundingClientRect()
      const showAbove = rect.bottom + 200 > window.innerHeight
      const top = showAbove ? rect.top - 8 : rect.bottom + 8
      const left = Math.min(rect.left, window.innerWidth - CARD_WIDTH - 16)
      setTooltipPos({ top, left: Math.max(8, left), above: showAbove })
    }, 300)
  }, [cancelTimers])

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1200)
  }, [value])

  if (!value) return <span className="text-ink/30 text-[13px]">--</span>

  const textCls = mono
    ? 'font-mono text-[12px] text-ink/70 block truncate'
    : 'text-ink/70 text-[13px] block truncate'

  return (
    <>
      <span
        ref={ref}
        className={textCls}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={scheduleHide}
      >
        {value}
      </span>
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
          <div className="px-7 pt-6 pb-5">
            {link ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`break-all leading-relaxed text-brand-600 underline decoration-brand-600/30 hover:decoration-brand-600 ${mono ? 'font-mono text-[13px]' : 'text-[15px]'}`}
              >
                {value}
              </a>
            ) : (
              <p className={`whitespace-pre-wrap break-words leading-relaxed ${mono ? 'font-mono text-[13px]' : 'text-[15px]'} text-ink/85`}>
                {value}
              </p>
            )}
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
