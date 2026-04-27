import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { UrlDetail } from '@/types'
import { getUrl, updateUrl } from './services/urlsService'

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#9F8FA8' }}>
      {children}
    </p>
  )
}

const ArrowIcon = () => (
  <svg className="ml-auto shrink-0 text-ink/20 group-hover:text-brand-500 transition-colors duration-100" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h8M7 3l4 4-4 4" />
  </svg>
)

export default function UrlDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<UrlDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopiedKey(null), 500)
  }

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getUrl(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateUrl(id!, { meta: newMeta })
    setItem((prev) => prev ? { ...prev, meta: newMeta } : null)
  }

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  const metaEntries = Object.entries(item.meta ?? {})
  const displayUrl = item.url.length > 60 ? item.url.slice(0, 60) + '…' : item.url

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="p-8 md:p-10 max-w-5xl mx-auto space-y-8">
      <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
        <span className="text-ink/35 font-medium">Catálogo</span>
        <span className="text-ink/25">›</span>
        <button onClick={() => navigate(-1)} className="text-ink/50 hover:text-brand-600 transition-colors duration-150 font-medium">
          URLs
        </button>
        <span className="text-ink/25">›</span>
        <span className="text-ink/70 font-medium font-mono">{displayUrl}</span>
      </nav>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9F8FA8' }}>
            URL
          </p>
          <h1 className="text-ink leading-snug break-all mb-3 font-mono" style={{ fontSize: '24px', fontWeight: 500 }}>
            {item.url}
          </h1>
        </div>
        <div className="shrink-0 pt-1">
          <button onClick={() => navigate(-1)} className="h-8 px-4 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-150">
            Volver
          </button>
        </div>
      </div>

      <div className="grid gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="space-y-10 min-w-0">
          <section>
            <SectionHeading>Enlace</SectionHeading>
            <a href={item.url} target="_blank" rel="noreferrer"
              className="text-[14px] text-brand-600 hover:text-brand-700 break-all transition-colors duration-150 font-mono">
              {item.url}
            </a>
          </section>

          {item.instrumento && (
            <section>
              <SectionHeading>Instrumento</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => navigate(`/instrumentos/${item.instrumento!.id}`)}
                  className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">Instrumento</span>
                  <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.instrumento.nombre}</span>
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          {item.instrumento?.base_de_datos && (
            <section>
              <SectionHeading>Base de datos</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => navigate(`/bases-de-datos/${item.instrumento!.base_de_datos!.id}`)}
                  className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">BD</span>
                  <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.instrumento.base_de_datos.nombre}</span>
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#9F8FA8' }}>Archivos vinculados</p>
              {(item.archivos?.length ?? 0) > 0 && (
                <button onClick={() => copy('archivos', item.archivos!.map((a) => a.descripcion ?? a.fecha_publicacion ?? a.id).join('\n'))}
                  className="text-[11px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1">
                  {copiedKey === 'archivos' ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l4 4 6-6" /></svg> : <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M2 10V2h8" /></svg>}
                  {copiedKey === 'archivos' ? 'Copiado' : 'Copiar todos'}
                </button>
              )}
            </div>
            {(item.archivos?.length ?? 0) === 0 ? (
              <p className="text-[13px] text-ink/[35%] italic">Sin archivos vinculados</p>
            ) : (
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                {item.archivos!.map((a) => (
                  <button key={a.id} onClick={() => navigate(`/archivos/${a.id}`)}
                    className="w-full text-left p-3 px-4 flex items-center gap-3 border-b last:border-b-0 border-ink/[5%] hover:bg-brand-500/[2%] transition-colors duration-100 group">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">Archivo</span>
                    <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">
                      {a.descripcion ?? a.fecha_publicacion ?? a.id.slice(0, 8)}
                    </span>
                    <ArrowIcon />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-1" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
          <SectionHeading>Metadata</SectionHeading>
          {metaEntries.length === 0 ? (
            <p className="text-[12px] text-ink/[35%] italic">Sin metadatos</p>
          ) : (
            <dl className="divide-y divide-ink/[5%]">
              {metaEntries.map(([key, val]) => (
                <div key={key} className="py-2">
                  <dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>{key}</dt>
                  <dd className="text-[13px] text-ink/80 break-words">
                    {val == null || val === '' ? <span className="text-ink/30 italic">—</span>
                      : Array.isArray(val) ? val.join(', ')
                      : typeof val === 'boolean' ? (val ? 'Sí' : 'No')
                      : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {canWrite && (
            <button onClick={() => handleMetaSave({ ...item.meta })} className="mt-3 text-[12px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
              Agregar campo
            </button>
          )}
          {(item.updated_at || item.updated_by_email) && (
            <div className="mt-6 pt-4 border-t border-ink/[6%] space-y-2">
              {item.updated_at && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>Última edición</p>
                  <p className="text-[12px] text-ink/70">{formatDate(item.updated_at)}</p>
                </div>
              )}
              {item.updated_by_email && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: '#9F8FA8' }}>Último editor</p>
                  <p className="text-[12px] text-ink/70">{item.updated_by_email}</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
    </div>
  )
}
