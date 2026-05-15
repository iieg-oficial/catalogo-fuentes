import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface JsonEditorPanelProps {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  onClose: () => void
  top: number
  left: number
  label?: string
}

type Mode = 'editor' | 'json'

export default function JsonEditorPanel({ value, onChange, onClose, top, left, label }: JsonEditorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('editor')
  const [entries, setEntries] = useState<[string, string][]>(() =>
    Object.entries(value).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
  )
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [rawJson, setRawJson] = useState(() => JSON.stringify(value, null, 2))
  const [jsonError, setJsonError] = useState(false)

  const entriesRef = useRef(entries)
  entriesRef.current = entries
  const newKeyRef = useRef(newKey)
  newKeyRef.current = newKey
  const newValRef = useRef(newVal)
  newValRef.current = newVal
  const modeRef = useRef(mode)
  modeRef.current = mode
  const rawJsonRef = useRef(rawJson)
  rawJsonRef.current = rawJson
  const jsonErrorRef = useRef(jsonError)
  jsonErrorRef.current = jsonError

  const buildObjFromEntries = useCallback(() => {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of entriesRef.current) {
      if (!k.trim()) continue
      try { obj[k.trim()] = JSON.parse(v) } catch { obj[k.trim()] = v }
    }
    if (newKeyRef.current.trim()) {
      const k = newKeyRef.current.trim()
      const v = newValRef.current
      try { obj[k] = JSON.parse(v) } catch { obj[k] = v }
    }
    return obj
  }, [])

  const handleSave = useCallback(() => {
    if (modeRef.current === 'json') {
      if (jsonErrorRef.current) return
      try {
        const parsed = JSON.parse(rawJsonRef.current)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          onChange(parsed)
        }
      } catch { return }
    } else {
      onChange(buildObjFromEntries())
    }
    onClose()
  }, [onChange, onClose, buildObjFromEntries])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) handleSave()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleSave() }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [handleSave])

  const switchToJson = () => {
    const obj = buildObjFromEntries()
    setRawJson(JSON.stringify(obj, null, 2))
    setJsonError(false)
    setMode('json')
  }

  const switchToEditor = () => {
    try {
      const parsed = JSON.parse(rawJson)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        setEntries(Object.entries(parsed).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)] as [string, string]))
        setNewKey('')
        setNewVal('')
      }
    } catch { /* stay on json mode if invalid */ return }
    setMode('editor')
  }

  const handleRawChange = (text: string) => {
    setRawJson(text)
    try {
      const parsed = JSON.parse(text)
      setJsonError(typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
    } catch {
      setJsonError(true)
    }
  }

  const handleAdd = () => {
    if (!newKey.trim()) return
    setEntries((prev) => [...prev, [newKey.trim(), newVal]])
    setNewKey('')
    setNewVal('')
    setTimeout(() => keyInputRef.current?.focus(), 0)
  }

  const handleRemove = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleKeyChange = (idx: number, k: string) => {
    setEntries((prev) => prev.map((e, i) => i === idx ? [k, e[1]] : e))
  }

  const handleValChange = (idx: number, v: string) => {
    setEntries((prev) => prev.map((e, i) => i === idx ? [e[0], v] : e))
  }

  const panelWidth = mode === 'json' ? 420 : 360
  const adjustedLeft = Math.min(left, window.innerWidth - panelWidth - 8)
  const adjustedTop = top + 380 > window.innerHeight
    ? Math.max(8, top - 380 - 8)
    : top

  return createPortal(
    <div
      ref={panelRef}
      data-portal
      style={{ position: 'fixed', top: adjustedTop, left: adjustedLeft, zIndex: 9999, width: panelWidth }}
      className="bg-white rounded-xl border border-ink/[10%] shadow-xl shadow-ink/[6%] overflow-hidden transition-[width] duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with mode toggle */}
      <div className="px-3 py-2 border-b border-ink/[6%] flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">{label ?? 'JSON'}</p>
        <div className="flex items-center gap-0.5 bg-ink/[4%] rounded-md p-0.5">
          <button
            type="button"
            onClick={mode === 'json' ? switchToEditor : undefined}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${mode === 'editor' ? 'bg-white text-ink/70 shadow-sm' : 'text-ink/35 hover:text-ink/50'}`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={mode === 'editor' ? switchToJson : undefined}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${mode === 'json' ? 'bg-white text-ink/70 shadow-sm' : 'text-ink/35 hover:text-ink/50'}`}
          >
            JSON
          </button>
        </div>
      </div>

      {mode === 'editor' ? (
        <>
          {/* Key-value list */}
          <div className="max-h-60 overflow-y-auto">
            {entries.length === 0 && !newKey && (
              <p className="px-3 py-3 text-[12px] text-ink/[35%] italic">Sin campos</p>
            )}
            {entries.map(([k, v], idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-ink/[4%] last:border-b-0">
                <input
                  value={k}
                  onChange={(e) => handleKeyChange(idx, e.target.value)}
                  className="flex-1 min-w-0 px-1.5 py-1 text-[12px] font-medium text-ink/80 border border-ink/[8%] rounded bg-ink/[2%] focus:outline-none focus:ring-1 focus:ring-brand-400"
                  placeholder="clave"
                />
                <input
                  value={v}
                  onChange={(e) => handleValChange(idx, e.target.value)}
                  className="flex-[1.5] min-w-0 px-1.5 py-1 text-[12px] text-ink/70 border border-ink/[8%] rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
                  placeholder="valor"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center text-ink/25 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6" /></svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add new entry */}
          <div className="px-2.5 py-2 border-t border-ink/[6%] flex items-center gap-1.5">
            <input
              ref={keyInputRef}
              autoFocus
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              className="flex-1 min-w-0 px-1.5 py-1 text-[12px] border border-dashed border-ink/[12%] rounded bg-ink/[2%] focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder-ink/[25%]"
              placeholder="nueva clave"
            />
            <input
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              className="flex-[1.5] min-w-0 px-1.5 py-1 text-[12px] border border-dashed border-ink/[12%] rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder-ink/[25%]"
              placeholder="valor"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="shrink-0 w-6 h-6 flex items-center justify-center text-brand-600 hover:bg-brand-500/[8%] transition-colors rounded"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5.5 1v9M1 5.5h9" /></svg>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Raw JSON textarea */}
          <div className="px-2.5 py-2">
            <textarea
              autoFocus
              value={rawJson}
              onChange={(e) => handleRawChange(e.target.value)}
              spellCheck={false}
              className={`w-full h-48 px-3 py-2.5 font-mono text-[12px] leading-relaxed border rounded-lg resize-none focus:outline-none focus:ring-1 ${
                jsonError
                  ? 'border-red-300 bg-red-50/50 text-red-800 focus:ring-red-400'
                  : 'border-ink/[8%] bg-ink/[2%] text-ink/80 focus:ring-brand-400'
              }`}
            />
            {jsonError && (
              <p className="mt-1 text-[11px] text-red-500">JSON invalido</p>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-ink/[6%] px-2.5 py-1.5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={mode === 'json' && jsonError}
          className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
            mode === 'json' && jsonError
              ? 'text-ink/25 cursor-not-allowed'
              : 'text-brand-600 hover:bg-brand-500/[6%]'
          }`}
        >
          Guardar
        </button>
      </div>
    </div>,
    document.body,
  )
}
