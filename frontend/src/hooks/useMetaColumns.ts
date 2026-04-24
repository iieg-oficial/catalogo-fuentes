import { useMemo, useState, useEffect } from 'react'

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

function load(storageKey: string): StoredCols {
  try {
    const raw = localStorage.getItem(`metacols:${storageKey}`)
    if (raw) return JSON.parse(raw) as StoredCols
  } catch { /* ignore */ }
  return { extra: [], hidden: [], types: {}, labels: {}, options: {}, colors: {} }
}

function save(storageKey: string, data: StoredCols) {
  try {
    localStorage.setItem(`metacols:${storageKey}`, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function useMetaColumns<T extends { meta?: Record<string, unknown> }>(
  items: T[],
  storageKey: string,
) {
  const [extraCols, setExtraCols] = useState<MetaColumnDef[]>(() => load(storageKey).extra)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => new Set(load(storageKey).hidden))
  const [colTypes, setColTypes] = useState<Record<string, ColumnType>>(() => load(storageKey).types)
  const [colLabels, setColLabels] = useState<Record<string, string>>(() => load(storageKey).labels)
  const [colOptions, setColOptions] = useState<Record<string, ListOption[]>>(() => load(storageKey).options ?? {})
  const [colColors, setColColors] = useState<Record<string, string>>(() => load(storageKey).colors ?? {})

  const dataKeys = useMemo(
    () => [...new Set(items.flatMap((i) => Object.keys(i.meta ?? {})))],
    [items],
  )

  const allMetaCols = useMemo<MetaColumnDef[]>(() => {
    const keys = [...new Set([...dataKeys, ...extraCols.map((c) => c.key)])]
    return keys
      .filter((k) => !hiddenCols.has(k))
      .map((k) => ({
        key: k,
        type: colTypes[k] ?? 'text',
        label: colLabels[k],
        options: colOptions[k],
        color: colColors[k],
      }))
  }, [dataKeys, extraCols, hiddenCols, colTypes, colLabels, colOptions])

  useEffect(() => {
    save(storageKey, {
      extra: extraCols,
      hidden: [...hiddenCols],
      types: colTypes,
      labels: colLabels,
      options: colOptions,
      colors: colColors,
    })
  }, [storageKey, extraCols, hiddenCols, colTypes, colLabels, colOptions, colColors])

  const addColumn = (key: string, type: ColumnType = 'text', options?: ListOption[], color?: string) => {
    const trimmed = key.trim()
    if (!trimmed) return
    setHiddenCols((prev) => { const next = new Set(prev); next.delete(trimmed); return next })
    setExtraCols((prev) => {
      if (prev.some((c) => c.key === trimmed)) return prev
      return [...prev, { key: trimmed, type }]
    })
    setColTypes((prev) => ({ ...prev, [trimmed]: type }))
    if (options?.length) {
      setColOptions((prev) => ({ ...prev, [trimmed]: options }))
    }
    if (color) {
      setColColors((prev) => ({ ...prev, [trimmed]: color }))
    }
  }

  const deleteColumn = (key: string) => {
    setHiddenCols((prev) => new Set([...prev, key]))
  }

  const renameColumn = (key: string, newLabel: string) => {
    setColLabels((prev) => ({ ...prev, [key]: newLabel.trim() || key }))
  }

  const updateColumn = (key: string, type: ColumnType, options?: ListOption[], label?: string, color?: string) => {
    setColTypes((prev) => ({ ...prev, [key]: type }))
    if (label !== undefined) {
      setColLabels((prev) => ({ ...prev, [key]: label.trim() || key }))
    }
    setColOptions((prev) => {
      if (options?.length) return { ...prev, [key]: options }
      const next = { ...prev }
      delete next[key]
      return next
    })
    setColColors((prev) => {
      if (color) return { ...prev, [key]: color }
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const getColDef = (key: string): MetaColumnDef => ({
    key,
    type: colTypes[key] ?? 'text',
    label: colLabels[key],
    options: colOptions[key],
  })

  const getMeta = (row: T) => row.meta ?? {}

  return { allMetaCols, addColumn, deleteColumn, renameColumn, updateColumn, getColDef, getMeta }
}
