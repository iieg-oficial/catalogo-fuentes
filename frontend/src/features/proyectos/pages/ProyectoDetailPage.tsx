import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAuthContext } from '@/context/AuthContext'
import type { ProyectoDetail } from '@/types'
import { getProyecto, updateProyecto } from '../services/proyectosService'
import { ESTADO_TONE, SECTION_LABEL_COLOR, DESCRIPTION_COLOR } from '@/consts/statusColors'

function EstadoChip({ label }: { label: string }) {
  const tone = ESTADO_TONE[label] ?? { bg: '#F4F4F5', fg: '#52525B', dot: '#a1a1aa' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      <span
        className="w-[6px] h-[6px] rounded-full shrink-0"
        style={{ backgroundColor: tone.dot }}
      />
      {label}
    </span>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: SECTION_LABEL_COLOR }}
    >
      {children}
    </p>
  )
}

export default function ProyectoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canWrite } = useAuthContext()

  const [item, setItem] = useState<ProyectoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setItem(await getProyecto(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleMetaSave = async (newMeta: Record<string, unknown>) => {
    await updateProyecto(id!, { meta: newMeta })
    setItem((prev) => prev ? { ...prev, meta: newMeta } : null)
  }

  if (loading) return <LoadingSpinner />
  if (error || !item) return <ErrorState onRetry={load} />

  const metaEntries = Object.entries(item.meta ?? {})
  const estadoRaw = item.meta?.estado
  const estado = typeof estadoRaw === 'string' ? estadoRaw : null
  const categorias = Array.isArray(item.meta?.categoria)
    ? (item.meta.categoria as unknown[]).map(String)
    : typeof item.meta?.categoria === 'string'
      ? [item.meta.categoria]
      : []

  const formatDate = (iso: string | null) => {
    if (!iso) return null
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="p-8 md:p-10 max-w-5xl mx-auto space-y-8">
      <nav className="flex items-center gap-1.5 text-[12px]" aria-label="Breadcrumb">
        <span aria-hidden="true" className="text-ink/60 font-medium">Catalogo</span>
        <span aria-hidden="true" className="text-ink/25">{'>'}</span>
        <button
          onClick={() => navigate(-1)}
          className="text-ink/80 hover:text-brand-600 transition-colors duration-150 font-medium"
        >
          Proyectos
        </button>
        <span aria-hidden="true" className="text-ink/25">{'>'}</span>
        <span className="text-ink/70 font-medium">{item.nombre}</span>
      </nav>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
            style={{ color: SECTION_LABEL_COLOR }}
          >
            Proyecto
          </p>

          <h1
            className="font-newsreader text-ink leading-tight break-words mb-3"
            style={{
              fontSize: '44px',
              fontWeight: 500,
            }}
          >
            {item.nombre}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {estado && <EstadoChip label={estado} />}
            {categorias.map((cat) => (
              <span
                key={cat}
                className="inline-block px-2.5 py-0.5 rounded-sm text-xs font-medium border border-ink/[10%] text-ink/60"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button
            onClick={() => navigate(-1)}
            className="h-8 px-4 rounded-md text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors duration-150"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid gap-12" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="space-y-10 min-w-0">
          <section>
            <SectionHeading>Descripcion</SectionHeading>
            {item.descripcion ? (
              <p
                className="font-newsreader"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: DESCRIPTION_COLOR,
                }}
              >
                {item.descripcion}
              </p>
            ) : (
              <p className="text-[13px] text-ink/70 italic">Sin descripcion</p>
            )}
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: SECTION_LABEL_COLOR }}>
                Productos vinculados
              </p>
              {item.productos.length > 0 && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.productos.map((p) => p.nombre).join('\n'))
                    setCopied(true)
                    if (copyTimer.current) clearTimeout(copyTimer.current)
                    copyTimer.current = setTimeout(() => setCopied(false), 500)
                  }}
                  className="text-[11px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1"
                  aria-label="Copiar productos vinculados"
                  title="Copiar todos los nombres"
                >
                  {copied ? (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l4 4 6-6" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="8" height="8" rx="1.5" />
                      <path d="M2 10V2h8" />
                    </svg>
                  )}
                  {copied ? 'Copiado' : 'Copiar todos'}
                </button>
              )}
            </div>
            {item.productos.length === 0 ? (
              <p className="text-[13px] text-ink/70 italic">Sin productos vinculados</p>
            ) : (
              <div className="border border-ink/[8%] rounded-lg bg-white overflow-hidden">
                {item.productos.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => navigate(`/productos/${producto.id}`)}
                    className="w-full text-left p-3 px-4 flex items-center gap-3 border-b last:border-b-0 border-ink/[5%] hover:bg-brand-500/[2%] transition-colors duration-100 group"
                  >
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-ink/[5%] text-ink/70 shrink-0">
                      Producto
                    </span>
                    <span className="text-[14px] font-medium text-ink group-hover:text-brand-600 transition-colors duration-100 truncate">
                      {producto.nombre}
                    </span>
                    <svg
                      className="ml-auto shrink-0 text-ink/20 group-hover:text-brand-500 transition-colors duration-100"
                      width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M3 7h8M7 3l4 4-4 4" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-1" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
          <SectionHeading>Metadata</SectionHeading>

          {metaEntries.length === 0 ? (
            <p className="text-[12px] text-ink/70 italic">Sin metadatos</p>
          ) : (
            <dl className="divide-y divide-ink/[5%]">
              {metaEntries.map(([key, val]) => (
                <div key={key} className="py-2">
                  <dt
                    className="text-[11px] uppercase tracking-wide font-medium mb-0.5"
                    style={{ color: SECTION_LABEL_COLOR }}
                  >
                    {key}
                  </dt>
                  <dd className="text-[13px] text-ink/80 break-words">
                    {val == null || val === ''
                      ? <span className="text-ink/60 italic">--</span>
                      : Array.isArray(val)
                        ? val.join(', ')
                        : typeof val === 'boolean'
                          ? val ? 'Si' : 'No'
                          : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {canWrite && (
            <button
              onClick={() => handleMetaSave({ ...item.meta })}
              className="mt-3 text-[12px] text-ink/40 hover:text-brand-600 transition-colors duration-150 flex items-center gap-1"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Agregar campo
            </button>
          )}

          {item.updated_at && (
            <div className="mt-6 pt-4 border-t border-ink/[6%] space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide font-medium mb-0.5" style={{ color: SECTION_LABEL_COLOR }}>
                  Ultima edicion
                </p>
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
