import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'
import ErrorState from '@/components/ErrorState'
import type { DatasetDetail } from '@/types'
import { getDataset } from '../services/datasetsService'
import { SECTION_LABEL_COLOR, DESCRIPTION_COLOR } from '@/consts/statusColors'

function SectionHeading({ children }: { children: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: SECTION_LABEL_COLOR }}>{children}</p>
}

const ArrowIcon = () => (
  <svg className="ml-auto shrink-0 text-ink/20 group-hover:text-brand-500 transition-colors duration-100" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7 3l4 4-4 4" /></svg>
)

export default function DatasetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<DatasetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text); setCopiedKey(key)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopiedKey(null), 500)
  }

  const load = async () => {
    if (!id) return
    setLoading(true); setError(false)
    try { setItem(await getDataset(id)) } catch { setError(true) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="p-8 md:p-10 max-w-5xl mx-auto space-y-8">
      <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
        <span aria-hidden="true" className="text-ink/60 font-medium">Catalogo</span><span aria-hidden="true" className="text-ink/25">{'>'}</span>
        <button onClick={() => navigate(-1)} className="text-ink/80 hover:text-brand-600 transition-colors duration-150 font-medium">Datasets</button>
        <span aria-hidden="true" className="text-ink/25">{'>'}</span><span className="text-ink/70 font-medium">{item.nombre}</span>
      </nav>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: SECTION_LABEL_COLOR }}>Dataset</p>
          <h1 className="font-newsreader text-ink leading-tight break-words mb-3" style={{ fontSize: '44px', fontWeight: 500 }}>{item.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {item.tema_principal && <span className="inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium border border-ink/[10%] text-ink/60">{item.tema_principal}</span>}
            {item.vigente && <span className="inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium bg-emerald-50 text-emerald-700">Vigente</span>}
          </div>
        </div>
        <div className="shrink-0 pt-1">
          <Button size="sm" onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </div>

      <div className="grid gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="space-y-10 min-w-0">
          <section>
            <SectionHeading>Descripcion</SectionHeading>
            {item.descripcion ? <p className="font-newsreader" style={{ fontSize: '16px', lineHeight: 1.65, color: DESCRIPTION_COLOR }}>{item.descripcion}</p> : <p className="text-[13px] text-ink/70 italic">Sin descripcion</p>}
          </section>

          {item.fuente && (
            <section>
              <SectionHeading>Fuente</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                <button onClick={() => navigate(`/fuentes/${item.fuente!.id}`)} className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/70 shrink-0">Fuente</span>
                  <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.fuente.nombre}</span>
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: SECTION_LABEL_COLOR }}>Ediciones</p>
              {item.ediciones.length > 0 && (
                <button aria-label="Copiar ediciones" onClick={() => copy('ediciones', item.ediciones.map((e) => e.nombre).join('\n'))} className="text-[11px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1">
                  {copiedKey === 'ediciones' ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6" /></svg> : <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M2 10V2h8" /></svg>}
                  {copiedKey === 'ediciones' ? 'Copiado' : 'Copiar todos'}
                </button>
              )}
            </div>
            {item.ediciones.length === 0 ? <p className="text-[13px] text-ink/70 italic">Sin ediciones</p> : (
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                {item.ediciones.map((e) => (
                  <button key={e.id} onClick={() => navigate(`/ediciones-dataset/${e.id}`)} className="w-full text-left p-3 px-4 flex items-center gap-3 border-b last:border-b-0 border-ink/[5%] hover:bg-brand-500/[2%] transition-colors duration-100 group">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/70 shrink-0">Edicion</span>
                    <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{e.nombre}</span>
                    <ArrowIcon />
                  </button>
                ))}
              </div>
            )}
          </section>

          {item.bases_de_datos.length > 0 && (
            <section>
              <SectionHeading>Bases de datos</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                {item.bases_de_datos.map((bd) => (
                  <button key={bd.id} onClick={() => navigate(`/bases-de-datos/${bd.id}`)} className="w-full text-left p-3 px-4 flex items-center gap-3 border-b last:border-b-0 border-ink/[5%] hover:bg-brand-500/[2%] transition-colors duration-100 group">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/70 shrink-0">BD</span>
                    <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{bd.db_nombre}</span>
                    <ArrowIcon />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-1" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
          <SectionHeading>Detalles</SectionHeading>
          <dl className="divide-y divide-ink/[5%]">
            {item.periodicidad && <div className="py-2"><dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Periodicidad</dt><dd className="text-[13px] text-ink/80">{item.periodicidad}</dd></div>}
            {item.identificador_persistente && <div className="py-2"><dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Identificador</dt><dd className="text-[13px] text-ink/80 font-mono break-all">{item.identificador_persistente}</dd></div>}
          </dl>
          {item.updated_at && (
            <div className="mt-6 pt-4 border-t border-ink/[6%]">
              <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Ultima edicion</p>
              <p className="text-[12px] text-ink/70">{formatDate(item.updated_at)}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
    </div>
  )
}
