import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { UrlCell } from '@/components/UrlCell'
import type { DistribucionDetail } from '@/types'
import { getDistribucion } from '../services/distribucionesService'

function SectionHeading({ children }: { children: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9F8FA8' }}>{children}</p>
}

const ArrowIcon = () => (
  <svg className="ml-auto shrink-0 text-ink/20 group-hover:text-brand-500 transition-colors duration-100" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7 3l4 4-4 4" /></svg>
)

export default function DistribucionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [item, setItem] = useState<DistribucionDetail | null>(null)
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
    try { setItem(await getDistribucion(id)) } catch { setError(true) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  const title = item.descriptor ?? item.id.slice(0, 8)

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="p-8 md:p-10 max-w-5xl mx-auto space-y-8">
      <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
        <span className="text-ink/35 font-medium">Catalogo</span><span className="text-ink/25">{'>'}</span>
        <button onClick={() => navigate(-1)} className="text-ink/50 hover:text-brand-600 transition-colors duration-150 font-medium">Distribuciones</button>
        <span className="text-ink/25">{'>'}</span><span className="text-ink/70 font-medium">{title}</span>
      </nav>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9F8FA8' }}>Distribucion</p>
          <h1 className="text-ink leading-tight break-words mb-3" style={{ fontFamily: '"Newsreader", "EB Garamond", Georgia, serif', fontSize: '44px', fontWeight: 500 }}>{title}</h1>
        </div>
        <div className="shrink-0 pt-1">
          <button onClick={() => navigate(-1)} className="h-8 px-4 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-150">Volver</button>
        </div>
      </div>

      <div className="grid gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="space-y-10 min-w-0">
          {item.url && (
            <section>
              <SectionHeading>Enlace</SectionHeading>
              <UrlCell url={item.url} wrap />
            </section>
          )}

          {item.edicion_dataset && (
            <section>
              <SectionHeading>Edicion de dataset</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                <button onClick={() => navigate(`/ediciones-dataset/${item.edicion_dataset!.id}`)} className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">Edicion</span>
                  <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.edicion_dataset.nombre}</span>
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9F8FA8' }}>Archivos</p>
              {item.archivos.length > 0 && (
                <button onClick={() => copy('archivos', item.archivos.map((a) => a.nombre_archivo).join('\n'))} className="text-[11px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1">
                  {copiedKey === 'archivos' ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6" /></svg> : <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M2 10V2h8" /></svg>}
                  {copiedKey === 'archivos' ? 'Copiado' : 'Copiar todos'}
                </button>
              )}
            </div>
            {item.archivos.length === 0 ? <p className="text-[13px] text-ink/[35%] italic">Sin archivos</p> : (
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                {item.archivos.map((a) => (
                  <button key={a.id} onClick={() => navigate(`/archivos/${a.id}`)} className="w-full text-left p-3 px-4 flex items-center gap-3 border-b last:border-b-0 border-ink/[5%] hover:bg-brand-500/[2%] transition-colors duration-100 group">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">Archivo</span>
                    <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{a.nombre_archivo}</span>
                    <ArrowIcon />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-1" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
          <SectionHeading>Detalles</SectionHeading>
          <dl className="divide-y divide-ink/[5%]">
            {item.observaciones_distribucion && <div className="py-2"><dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>Observaciones</dt><dd className="text-[13px] text-ink/80">{item.observaciones_distribucion}</dd></div>}
            <div className="py-2"><dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>Requiere autenticacion</dt><dd className="text-[13px] text-ink/80">{item.requiere_autenticacion ? 'Si' : 'No'}</dd></div>
            <div className="py-2"><dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>URL persistente</dt><dd className="text-[13px] text-ink/80">{item.es_url_persistente ? 'Si' : 'No'}</dd></div>
          </dl>
          {item.updated_at && (
            <div className="mt-6 pt-4 border-t border-ink/[6%]">
              <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>Ultima edicion</p>
              <p className="text-[12px] text-ink/70">{formatDate(item.updated_at)}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
    </div>
  )
}
