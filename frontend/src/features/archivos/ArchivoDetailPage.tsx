import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { Archivo } from '@/types'
import { getArchivo, updateArchivo } from './services/archivosService'

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

export default function ArchivoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()
  const [item, setItem] = useState<Archivo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getArchivo(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateArchivo(id!, { meta: newMeta })
    setItem((prev) => prev ? { ...prev, meta: newMeta } : null)
  }

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  const metaEntries = Object.entries(item.meta ?? {})
  const title = item.descripcion ?? 'Sin descripción'

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
          Archivos
        </button>
        <span className="text-ink/25">›</span>
        <span className="text-ink/70 font-medium">{title}</span>
      </nav>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9F8FA8' }}>
            Archivo
          </p>
          <h1 className="text-ink leading-tight break-words mb-3" style={{ fontFamily: '"Newsreader", "EB Garamond", Georgia, serif', fontSize: '44px', fontWeight: 500 }}>
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {item.fecha_fuente && (
              <span className="inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium border border-ink/[10%] text-ink/60">
                Fuente: {item.fecha_fuente}
              </span>
            )}
            {item.fecha_publicacion && (
              <span className="inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium border border-ink/[10%] text-ink/60">
                Publicación: {item.fecha_publicacion}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 pt-1">
          <button onClick={() => navigate(-1)} className="h-8 px-4 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-150">
            Volver
          </button>
        </div>
      </div>

      <div className="grid gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="space-y-10 min-w-0">
          {item.url_ref && (
            <section>
              <SectionHeading>Enlace</SectionHeading>
              <a href={item.url_ref.url} target="_blank" rel="noreferrer"
                className="text-[14px] text-brand-600 hover:text-brand-700 break-all transition-colors duration-150 font-mono">
                {item.url_ref.url}
              </a>
            </section>
          )}

          {item.url_ref?.instrumento && (
            <section>
              <SectionHeading>Instrumento</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => navigate(`/instrumentos/${item.url_ref!.instrumento!.id}`)}
                  className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">Instrumento</span>
                  <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.url_ref.instrumento.nombre}</span>
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          {item.url_ref?.instrumento?.base_de_datos && (
            <section>
              <SectionHeading>Base de datos</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => navigate(`/bases-de-datos/${item.url_ref!.instrumento!.base_de_datos!.id}`)}
                  className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/50 shrink-0">BD</span>
                  <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.url_ref.instrumento.base_de_datos.nombre}</span>
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}
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
