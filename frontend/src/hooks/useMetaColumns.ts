import { useMemo, useState } from 'react'

export function useMetaColumns<T extends { meta?: Record<string, unknown> }>(items: T[]) {
  const dataKeys = useMemo(
    () => [...new Set(items.flatMap((i) => Object.keys(i.meta ?? {})))],
    [items],
  )
  const [extraCols, setExtraCols] = useState<string[]>([])
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())

  const allMetaCols = useMemo(
    () => [...new Set([...dataKeys, ...extraCols])].filter((k) => !hiddenCols.has(k)),
    [dataKeys, extraCols, hiddenCols],
  )

  const addColumn = (key: string) => {
    const trimmed = key.trim()
    if (!trimmed) return
    setHiddenCols((prev) => { const next = new Set(prev); next.delete(trimmed); return next })
    setExtraCols((prev) => [...new Set([...prev, trimmed])])
  }

  const deleteColumn = (key: string) => {
    setHiddenCols((prev) => new Set([...prev, key]))
  }

  const getMeta = (row: T) => row.meta ?? {}

  return { allMetaCols, addColumn, deleteColumn, getMeta }
}
