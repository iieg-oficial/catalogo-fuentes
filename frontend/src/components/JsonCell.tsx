import { useState, useRef, useEffect, useCallback, useContext, memo } from 'react'
import { createPortal } from 'react-dom'
import { CellContext } from '@/components/CatalogGrid'

interface JsonCellProps {
  value: Record<string, unknown> | null | undefined
}

const CARD_WIDTH = 440

function isNested(val: unknown): boolean {
  return typeof val === 'object' && val !== null
}

function fmtVal(v: unknown): string {
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

function colorizeJson(obj: unknown): React.ReactNode[] {
  const raw = JSON.stringify(obj, null, 2)
  const parts: React.ReactNode[] = []
  const regex = /("(?:\\.|[^"\\])*")\s*:/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > last) parts.push(raw.slice(last, match.index))
    parts.push(<span key={match.index} className="text-brand-600 font-medium">{match[1]}</span>)
    parts.push(':')
    last = match.index + match[0].length
  }
  if (last < raw.length) parts.push(raw.slice(last))
  return parts
}

function JsonCell({ value }: JsonCellProps) {
  const cellCtx = useContext(CellContext)
  const entries = Object.entries(value ?? {})
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
    if (!entries.length) return
    showTimer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const showAbove = rect.bottom + 200 > window.innerHeight
      const top = showAbove ? rect.top - 8 : rect.bottom + 8
      const left = Math.min(rect.left, window.innerWidth - CARD_WIDTH - 16)
      setTooltipPos({ top, left: Math.max(8, left), above: showAbove })
    }, 300)
  }, [cancelTimers, entries.length])

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!entries.length) return
    navigator.clipboard.writeText(JSON.stringify(value, null, 2))
    setCopied(true)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1200)
  }, [value, entries.length])

  if (!entries.length) return <span className="text-ink/60 text-[13px]">--</span>

  return (
    <>
      <span
        ref={ref}
        className="block truncate text-[12px] text-ink/70"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={scheduleHide}
      >
        {entries.map(([k, v], i) => (
          <span key={k}>
            {i > 0 && <span className="text-ink/20 mx-0.5" aria-hidden="true">·</span>}
            <span className="font-medium text-brand-700">{k}: </span>
            <span className="text-ink/70">{isNested(v) ? '{...}' : fmtVal(v)}</span>
          </span>
        ))}
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
          {cellCtx && (
            <div className="flex items-center justify-between px-5 pt-3 pb-0">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink/60">{cellCtx.columnName}</span>
              <span className="text-[10px] font-medium text-ink/30" aria-hidden="true">#{cellCtx.rowIndex + 1}</span>
            </div>
          )}
          <div className={`px-5 ${cellCtx ? 'pt-3' : 'pt-5'} pb-4 max-h-80 overflow-y-auto`}>
            <pre className="font-mono text-[12px] leading-relaxed text-ink/70 whitespace-pre-wrap break-all">
              {colorizeJson(value)}
            </pre>
          </div>
          <div className="flex justify-end border-t border-ink/5 px-5 py-3">
            <button
              onClick={handleCopy}
              aria-label="Copiar valor"
              className="flex items-center gap-1.5 text-[13px] text-ink/60 transition-colors hover:text-brand-600"
            >
              <span>{copied ? 'Copiado' : 'Copiar JSON'}</span>
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

export default memo(JsonCell)
export { JsonCell }
