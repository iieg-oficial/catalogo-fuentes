import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TagsEditorPanelProps {
  value: string[]
  onChange: (v: string[]) => void
  onClose: () => void
  top: number
  left: number
  label?: string
}

export default function TagsEditorPanel({ value, onChange, onClose, top, left, label }: TagsEditorPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [tags, setTags] = useState<string[]>(() => [...value])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handleSave()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleSave() }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  })

  const handleSave = () => {
    onChange(tags)
    onClose()
  }

  const addTag = () => {
    const t = draft.trim()
    if (!t || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setDraft('')
    inputRef.current?.focus()
  }

  const removeTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !draft && tags.length) removeTag(tags.length - 1)
  }

  const panelWidth = 320
  const adjustedLeft = Math.min(left, window.innerWidth - panelWidth - 8)
  const adjustedTop = top + 280 > window.innerHeight
    ? Math.max(8, top - 280 - 8)
    : top

  return createPortal(
    <div
      ref={ref}
      data-portal
      style={{ position: 'fixed', top: adjustedTop, left: adjustedLeft, zIndex: 9999, width: panelWidth }}
      className="bg-white rounded-xl border border-ink/[10%] shadow-xl shadow-ink/[6%] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2.5 border-b border-ink/[6%]">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/60">{label ?? 'Etiquetas'}</p>
      </div>

      <div className="px-2.5 py-2.5 min-h-[48px] max-h-48 overflow-y-auto">
        {tags.length === 0 && !draft && (
          <p className="text-[12px] text-ink/70 italic mb-1.5">Sin etiquetas</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium bg-brand-500/10 text-brand-700"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="text-brand-500/50 hover:text-red-500 transition-colors"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" /></svg>
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="px-2.5 py-2 border-t border-ink/[6%] flex items-center gap-1.5">
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 px-1.5 py-1 text-[12px] border border-dashed border-ink/[12%] rounded bg-ink/[2%] focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder-ink/[25%]"
          placeholder="nueva etiqueta..."
        />
        <button
          type="button"
          onClick={addTag}
          className="shrink-0 w-6 h-6 flex items-center justify-center text-brand-600 hover:bg-brand-500/[8%] transition-colors rounded"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5.5 1v9M1 5.5h9" /></svg>
        </button>
      </div>

      <div className="border-t border-ink/[6%] px-2.5 py-1.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-500/[6%] rounded-md transition-colors"
        >
          Guardar
        </button>
      </div>
    </div>,
    document.body,
  )
}
