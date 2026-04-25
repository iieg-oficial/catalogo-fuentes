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
  tablas: number
  'bases-de-datos': number
  instrumentos: number
  urls: number
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
      const [p, prod, t, bd, inst, u, arch] = await Promise.allSettled([
        apiClient.get<any[]>('/proyectos/'),
        apiClient.get<any[]>('/productos/'),
        apiClient.get<any[]>('/tablas/'),
        apiClient.get<any[]>('/bases-de-datos/'),
        apiClient.get<any[]>('/instrumentos/'),
        apiClient.get<any[]>('/urls/'),
        apiClient.get<any[]>('/archivos/'),
      ])

      const entries: SearchEntry[] = []
      const c: Partial<CatalogCounts> = {}

      if (p.status === 'fulfilled') {
        const data = p.value.data
        c.proyectos = data.length
        data.forEach((r: any) => entries.push({
          id: r.id, type: 'proyecto', typeLabel: 'Proyecto',
          label: r.nombre, subtitle: r.descripcion ?? undefined,
          path: `/proyectos/${r.id}`,
          text: [r.nombre, r.descripcion].filter(Boolean).join(' '),
        }))
      }

      if (prod.status === 'fulfilled') {
        const data = prod.value.data
        c.productos = data.length
        data.forEach((r: any) => entries.push({
          id: r.id, type: 'producto', typeLabel: 'Producto',
          label: r.nombre, subtitle: r.proyecto?.nombre,
          path: `/productos/${r.id}`,
          text: [r.nombre, r.descripcion, r.proyecto?.nombre].filter(Boolean).join(' '),
        }))
      }

      if (t.status === 'fulfilled') {
        const data = t.value.data
        c.tablas = data.length
        data.forEach((r: any) => entries.push({
          id: r.id, type: 'tabla', typeLabel: 'Tabla',
          label: r.nombre, subtitle: r.base_de_datos?.nombre,
          path: `/tablas/${r.id}`,
          text: [r.nombre, r.base_de_datos?.nombre].filter(Boolean).join(' '),
        }))
      }

      if (bd.status === 'fulfilled') {
        const data = bd.value.data
        c['bases-de-datos'] = data.length
        data.forEach((r: any) => entries.push({
          id: r.id, type: 'base_de_datos', typeLabel: 'Base de datos',
          label: r.nombre, subtitle: r.tema ?? undefined,
          path: `/bases-de-datos/${r.id}`,
          text: [r.nombre, r.tema, r.descripcion].filter(Boolean).join(' '),
        }))
      }

      if (inst.status === 'fulfilled') {
        const data = inst.value.data
        c.instrumentos = data.length
        data.forEach((r: any) => entries.push({
          id: r.id, type: 'instrumento', typeLabel: 'Instrumento',
          label: r.nombre, subtitle: r.base_de_datos?.nombre,
          path: `/instrumentos/${r.id}`,
          text: [r.nombre, r.descripcion, r.base_de_datos?.nombre].filter(Boolean).join(' '),
        }))
      }

      if (u.status === 'fulfilled') {
        const data = u.value.data
        c.urls = data.length
        data.forEach((r: any) => entries.push({
          id: r.id, type: 'url', typeLabel: 'URL',
          label: r.url, subtitle: r.instrumento?.nombre,
          path: `/urls/${r.id}`,
          text: [r.url, r.instrumento?.nombre].filter(Boolean).join(' '),
        }))
      }

      if (arch.status === 'fulfilled') {
        const data = arch.value.data
        c.archivos = data.length
        data.forEach((r: any) => entries.push({
          id: r.id, type: 'archivo', typeLabel: 'Archivo',
          label: r.descripcion || r.url_ref?.url || 'Sin descripción',
          subtitle: r.url_ref?.instrumento?.nombre,
          path: `/archivos/${r.id}`,
          text: [r.descripcion, r.url_ref?.url, r.url_ref?.instrumento?.nombre].filter(Boolean).join(' '),
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
