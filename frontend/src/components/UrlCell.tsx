import { useState, useRef, memo } from 'react'

interface UrlCellProps {
  url: string
  maxWidth?: number
  wrap?: boolean
}

function UrlCell({ url, maxWidth = 180, wrap = false }: UrlCellProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className={`group flex gap-1 min-w-0 ${wrap ? 'items-start' : 'items-center'}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`font-mono text-[12px] text-brand-600 hover:underline${wrap ? ' break-all' : ' truncate'}`}
        style={wrap ? undefined : { maxWidth }}
      >
        {url}
      </a>
      <button
        onClick={handleCopy}
        aria-label="Copiar URL"
        className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-100 text-ink/60 hover:text-brand-600"
      >
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 7 5.5 10.5 12 4" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="8" height="8" rx="1" />
            <path d="M2 10V3a1 1 0 0 1 1-1h7" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default memo(UrlCell)
export { UrlCell }
