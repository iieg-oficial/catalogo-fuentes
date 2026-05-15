import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import type { Archivo } from '@/types'
import { getArchivo } from '../services/archivosService'
import { SECTION_LABEL_COLOR, DESCRIPTION_COLOR } from '@/consts/statusColors'

function SectionHeading({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: SECTION_LABEL_COLOR }}>
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

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  const title = item.nombre_archivo

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="p-8 md:p-10 max-w-5xl mx-auto space-y-8">
      <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
        <span aria-hidden="true" className="text-ink/60 font-medium">Catalogo</span>
        <span aria-hidden="true" className="text-ink/25">{'>'}</span>
        <button onClick={() => navigate(-1)} className="text-ink/80 hover:text-brand-600 transition-colors duration-150 font-medium">
          Archivos
        </button>
        <span aria-hidden="true" className="text-ink/25">{'>'}</span>
        <span className="text-ink/70 font-medium">{title}</span>
      </nav>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: SECTION_LABEL_COLOR }}>
            Archivo
          </p>
          <h1 className="font-newsreader text-ink leading-tight break-words mb-3" style={{ fontSize: '44px', fontWeight: 500 }}>
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {item.rol_archivo && (
              <span className="inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium border border-ink/[10%] text-ink/60">
                Rol: {item.rol_archivo}
              </span>
            )}
            {item.tamano_bytes != null && (
              <span className="inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium border border-ink/[10%] text-ink/60">
                {(item.tamano_bytes / 1024).toFixed(1)} KB
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
          {item.distribucion && (
            <section>
              <SectionHeading>Distribucion</SectionHeading>
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                <button
                  onClick={() => navigate(`/distribuciones/${item.distribucion!.id}`)}
                  className="w-full text-left p-3 px-4 flex items-center gap-3 hover:bg-brand-500/[2%] transition-colors duration-100 group"
                >
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/70 shrink-0">Distribucion</span>
                  <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 truncate">{item.distribucion.descriptor ?? item.distribucion.id.slice(0, 8)}</span>
                  <ArrowIcon />
                </button>
              </div>
            </section>
          )}

          {item.observaciones_archivo && (
            <section>
              <SectionHeading>Observaciones</SectionHeading>
              <p className="font-newsreader" style={{ fontSize: '16px', lineHeight: 1.65, color: DESCRIPTION_COLOR }}>
                {item.observaciones_archivo}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-1" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
          <SectionHeading>Detalles</SectionHeading>
          <dl className="divide-y divide-ink/[5%]">
            {item.ruta_relativa_en_distribucion && (
              <div className="py-2">
                <dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Ruta relativa</dt>
                <dd className="text-[13px] text-ink/80 break-words font-mono">{item.ruta_relativa_en_distribucion}</dd>
              </div>
            )}
            {item.ruta_almacenamiento && (
              <div className="py-2">
                <dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Ruta almacenamiento</dt>
                <dd className="text-[13px] text-ink/80 break-words font-mono">{item.ruta_almacenamiento}</dd>
              </div>
            )}
            {item.hash_sha256 && (
              <div className="py-2">
                <dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Hash SHA-256</dt>
                <dd className="text-[13px] text-ink/80 break-all font-mono">{item.hash_sha256}</dd>
              </div>
            )}
            {item.fecha_ingesta_sistema && (
              <div className="py-2">
                <dt className="text-[11px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Ingesta</dt>
                <dd className="text-[13px] text-ink/80">{formatDate(item.fecha_ingesta_sistema)}</dd>
              </div>
            )}
          </dl>
          {item.updated_at && (
            <div className="mt-6 pt-4 border-t border-ink/[6%] space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>Ultima edicion</p>
                <p className="text-[12px] text-ink/70">{formatDate(item.updated_at)}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
    </div>
  )
}
