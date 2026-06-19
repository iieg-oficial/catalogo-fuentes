import { useEffect, useState, useCallback } from 'react'
import apiClient from '@/services/apiClient'

export interface SearchResult {
  id: string
  type: string
  typeLabel: string
  label: string
  subtitle?: string
  path: string
  score: number
}

interface SearchEntry {
  id: string
  type: string
  typeLabel: string
  label: string
  subtitle?: string
  path: string
  text: string
}

export interface CatalogCounts {
  proyectos: number
  productos: number
  fuentes: number
  datasets: number
  'ediciones-dataset': number
  distribuciones: number
  'bases-de-datos': number
  'informacion-tablas': number
  archivos: number
}

function scoreEntry(query: string, text: string): number {
  if (!query.trim() || !text) return 0
  const q = query.toLowerCase().trim()
  const t = text.toLowerCase()

  if (t === q) return 100
  if (t.startsWith(q)) return 95
  if (t.includes(q)) return 85

  const qWords = q.split(/\s+/).filter((w) => w.length >= 2)
  if (qWords.length > 0) {
    const matched = qWords.filter((w) => t.includes(w)).length
    if (matched === qWords.length) return 75
    if (matched > 0) return 40 + Math.round((matched / qWords.length) * 30)
  }

  // Character sequence (fzf-style)
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  if (qi === q.length) return 15 + Math.round((q.length / t.length) * 20)

  // Trigram similarity for typo tolerance
  if (q.length >= 3 && t.length >= 3) {
    const trigrams = (s: string) => {
      const set = new Set<string>()
      for (let i = 0; i <= s.length - 3; i++) set.add(s.slice(i, i + 3))
      return set
    }
    const qg = trigrams(q)
    const tg = trigrams(t)
    let common = 0
    qg.forEach((g) => { if (tg.has(g)) common++ })
    const sim = (2 * common) / (qg.size + tg.size)
    if (sim > 0.2) return Math.round(sim * 35)
  }

  return 0
}

export function useGlobalSearch() {
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [counts, setCounts] = useState<Partial<CatalogCounts>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const build = async () => {
      const [p, prod, fue, ds, ed, dist, bd, it, arch] = await Promise.allSettled([
        apiClient.get<Record<string, unknown>[]>('/proyectos/'),
        apiClient.get<Record<string, unknown>[]>('/productos/'),
        apiClient.get<Record<string, unknown>[]>('/fuentes/'),
        apiClient.get<Record<string, unknown>[]>('/datasets/'),
        apiClient.get<Record<string, unknown>[]>('/ediciones-dataset/'),
        apiClient.get<Record<string, unknown>[]>('/distribuciones/'),
        apiClient.get<Record<string, unknown>[]>('/bases-de-datos/'),
        apiClient.get<Record<string, unknown>[]>('/informacion-tablas/'),
        apiClient.get<Record<string, unknown>[]>('/archivos/'),
      ])

      const entries: SearchEntry[] = []
      const c: Partial<CatalogCounts> = {}

      if (p.status === 'fulfilled') {
        const data = p.value.data
        c.proyectos = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'proyecto', typeLabel: 'Proyecto',
          label: String(r.nombre ?? ''), subtitle: r.descripcion ? String(r.descripcion) : undefined,
          path: `/proyectos?q=${encodeURIComponent(String(r.nombre ?? ''))}`,
          text: [r.nombre, r.descripcion].filter(Boolean).map(String).join(' '),
        }))
      }

      if (prod.status === 'fulfilled') {
        const data = prod.value.data
        c.productos = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'producto', typeLabel: 'Producto',
          label: String(r.nombre ?? ''), subtitle: (r.proyecto as Record<string, unknown> | null)?.nombre ? String((r.proyecto as Record<string, unknown>).nombre) : undefined,
          path: `/productos?q=${encodeURIComponent(String(r.nombre ?? ''))}`,
          text: [r.nombre, r.descripcion, (r.proyecto as Record<string, unknown> | null)?.nombre].filter(Boolean).map(String).join(' '),
        }))
      }

      if (fue.status === 'fulfilled') {
        const data = fue.value.data
        c.fuentes = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'fuente', typeLabel: 'Fuente',
          label: String(r.nombre ?? ''), subtitle: r.sector ? String(r.sector) : undefined,
          path: `/fuentes?q=${encodeURIComponent(String(r.nombre ?? ''))}`,
          text: [r.nombre, r.sector, r.descripcion].filter(Boolean).map(String).join(' '),
        }))
      }

      if (ds.status === 'fulfilled') {
        const data = ds.value.data
        c.datasets = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'dataset', typeLabel: 'Dataset',
          label: String(r.nombre ?? ''), subtitle: r.descripcion ? String(r.descripcion) : undefined,
          path: `/datasets?q=${encodeURIComponent(String(r.nombre ?? ''))}`,
          text: [r.nombre, r.descripcion].filter(Boolean).map(String).join(' '),
        }))
      }

      if (ed.status === 'fulfilled') {
        const data = ed.value.data
        c['ediciones-dataset'] = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'edicion_dataset', typeLabel: 'Edicion',
          label: String(r.edicion ?? ''), subtitle: (r.dataset as Record<string, unknown> | null)?.nombre ? String((r.dataset as Record<string, unknown>).nombre) : undefined,
          path: `/ediciones-dataset?q=${encodeURIComponent(String(r.edicion ?? ''))}`,
          text: [r.edicion, (r.dataset as Record<string, unknown> | null)?.nombre].filter(Boolean).map(String).join(' '),
        }))
      }

      if (dist.status === 'fulfilled') {
        const data = dist.value.data
        c.distribuciones = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'distribucion', typeLabel: 'Distribucion',
          label: String(r.distribucion ?? String(r.id).slice(0, 8)),
          subtitle: r.url ? String(r.url) : undefined,
          path: `/distribuciones?q=${encodeURIComponent(String(r.distribucion ?? String(r.id).slice(0, 8)))}`,
          text: [r.distribucion, r.url].filter(Boolean).map(String).join(' '),
        }))
      }

      if (bd.status === 'fulfilled') {
        const data = bd.value.data
        c['bases-de-datos'] = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'base_de_datos', typeLabel: 'Base de datos',
          label: String(r.db_nombre ?? ''), subtitle: (r.archivo as Record<string, unknown> | null)?.nombre_archivo ? String((r.archivo as Record<string, unknown>).nombre_archivo) : undefined,
          path: `/bases-de-datos?q=${encodeURIComponent(String(r.db_nombre ?? ''))}`,
          text: [r.db_nombre, (r.archivo as Record<string, unknown> | null)?.nombre_archivo].filter(Boolean).map(String).join(' '),
        }))
      }

      if (it.status === 'fulfilled') {
        const data = it.value.data
        c['informacion-tablas'] = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'informacion_tablas', typeLabel: 'Tabla',
          label: String(r.nombre ?? ''), subtitle: (r.base_de_datos as Record<string, unknown> | null)?.db_nombre ? String((r.base_de_datos as Record<string, unknown>).db_nombre) : undefined,
          path: `/informacion-tablas?q=${encodeURIComponent(String(r.nombre ?? ''))}`,
          text: [r.nombre, r.descripcion, (r.base_de_datos as Record<string, unknown> | null)?.db_nombre].filter(Boolean).map(String).join(' '),
        }))
      }

      if (arch.status === 'fulfilled') {
        const data = arch.value.data
        c.archivos = data.length
        data.forEach((r) => entries.push({
          id: String(r.id), type: 'archivo', typeLabel: 'Archivo',
          label: String(r.nombre_archivo ?? ''),
          subtitle: (r.distribucion as Record<string, unknown> | null)?.distribucion ? String((r.distribucion as Record<string, unknown>).distribucion) : undefined,
          path: `/archivos?q=${encodeURIComponent(String(r.nombre_archivo ?? ''))}`,
          text: [r.nombre_archivo, r.observaciones_archivo, (r.distribucion as Record<string, unknown> | null)?.distribucion].filter(Boolean).map(String).join(' '),
        }))
      }

      setIndex(entries)
      setCounts(c)
      setReady(true)
    }

    build()
  }, [])

  const search = useCallback((query: string): SearchResult[] => {
    if (!query.trim() || !ready) return []
    return index
      .map((e) => ({ ...e, score: scoreEntry(query, e.text) }))
      .filter((r) => r.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
  }, [index, ready])

  return { search, counts, ready }
}
