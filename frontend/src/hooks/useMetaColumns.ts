import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { API_URL } from '@/consts'
import { getMetaColumns, saveMetaColumns } from '@/services/metaColumnsService'

export type ColumnType = 'text' | 'number' | 'url' | 'date' | 'boolean' | 'list'

export interface ListOption {
  label: string
  color?: string
}

export const LIST_COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]

export interface MetaColumnDef {
  key: string
  type: ColumnType
  label?: string
  options?: ListOption[]
  color?: string
}

interface StoredCols {
  extra: MetaColumnDef[]
  hidden: string[]
  types: Record<string, ColumnType>
  labels: Record<string, string>
  options: Record<string, ListOption[]>
  colors: Record<string, string>
}

const EMPTY: StoredCols = { extra: [], hidden: [], types: {}, labels: {}, options: {}, colors: {} }

const WS_BASE = API_URL.replace(/^http/, 'ws')

function mergeConfig(raw: unknown): StoredCols {
  const partial = (raw ?? {}) as Partial<StoredCols>
  return {
    extra: partial.extra ?? [],
    hidden: partial.hidden ?? [],
    types: partial.types ?? {},
    labels: partial.labels ?? {},
    options: partial.options ?? {},
    colors: partial.colors ?? {},
  }
}

export function useMetaColumns<T extends { meta?: Record<string, unknown> }>(
  items: T[],
  entityType: string,
) {
  const [cfg, setCfg] = useState<StoredCols>(EMPTY)
  const [ready, setReady] = useState(false)
  const skipSave = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  // Load initial config from API
  useEffect(() => {
    getMetaColumns(entityType)
      .then((raw) => {
        skipSave.current = true
        setCfg(mergeConfig(raw))
        setReady(true)
      })
      .catch(() => setReady(true))
  }, [entityType])

  // Debounced save to API on config change
  useEffect(() => {
    if (!ready) return
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveMetaColumns(entityType, cfg as unknown as Record<string, unknown>)
    }, 400)
    return () => clearTimeout(saveTimer.current)
  }, [cfg, entityType, ready])

  // WebSocket for real-time sync with other clients
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/meta-columns/ws/${entityType}`)
    ws.onmessage = (e) => {
      try {
        clearTimeout(saveTimer.current)
        skipSave.current = true
        setCfg(mergeConfig(JSON.parse(e.data as string)))
      } catch { /* ignore malformed messages */ }
    }
    ws.onerror = () => { /* ignore — WS is best-effort for sync */ }
    return () => ws.close()
  }, [entityType])

  const dataKeys = useMemo(
    () => [...new Set(items.flatMap((i) => Object.keys(i.meta ?? {})))],
    [items],
  )

  const hiddenSet = useMemo(() => new Set(cfg.hidden), [cfg.hidden])

  const allMetaCols = useMemo<MetaColumnDef[]>(() => {
    const keys = [...new Set([...dataKeys, ...cfg.extra.map((c) => c.key)])]
    return keys
      .filter((k) => !hiddenSet.has(k))
      .map((k) => ({
        key: k,
        type: cfg.types[k] ?? 'text',
        label: cfg.labels[k],
        options: cfg.options[k],
        color: cfg.colors[k],
      }))
  }, [dataKeys, cfg, hiddenSet])

  const addColumn = useCallback((key: string, type: ColumnType = 'text', options?: ListOption[], color?: string) => {
    const trimmed = key.trim()
    if (!trimmed) return
    setCfg((prev) => ({
      ...prev,
      hidden: prev.hidden.filter((k) => k !== trimmed),
      extra: prev.extra.some((c) => c.key === trimmed) ? prev.extra : [...prev.extra, { key: trimmed, type }],
      types: { ...prev.types, [trimmed]: type },
      options: options?.length ? { ...prev.options, [trimmed]: options } : prev.options,
      colors: color ? { ...prev.colors, [trimmed]: color } : prev.colors,
    }))
  }, [])

  const deleteColumn = useCallback((key: string) => {
    setCfg((prev) => ({ ...prev, hidden: [...prev.hidden.filter((k) => k !== key), key] }))
  }, [])

  const renameColumn = useCallback((key: string, newLabel: string) => {
    setCfg((prev) => ({ ...prev, labels: { ...prev.labels, [key]: newLabel.trim() || key } }))
  }, [])

  const updateColumn = useCallback((
    key: string,
    type: ColumnType,
    options?: ListOption[],
    label?: string,
    color?: string,
  ) => {
    setCfg((prev) => {
      const newOptions = { ...prev.options }
      if (options?.length) newOptions[key] = options
      else delete newOptions[key]

      const newColors = { ...prev.colors }
      if (color) newColors[key] = color
      else delete newColors[key]

      return {
        ...prev,
        types: { ...prev.types, [key]: type },
        labels: label !== undefined ? { ...prev.labels, [key]: label.trim() || key } : prev.labels,
        options: newOptions,
        colors: newColors,
      }
    })
  }, [])

  const getColDef = useCallback((key: string): MetaColumnDef => ({
    key,
    type: cfg.types[key] ?? 'text',
    label: cfg.labels[key],
    options: cfg.options[key],
  }), [cfg])

  const getMeta = useCallback((row: T) => row.meta ?? {}, [])

  return { allMetaCols, addColumn, deleteColumn, renameColumn, updateColumn, getColDef, getMeta }
}
