import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/Topbar'

// ── Types ───────────────────────────────────────────────────────────────────

type Side = 'top' | 'right' | 'bottom' | 'left'
type Pos  = { x: number; y: number }

interface FieldDef {
  name: string
  kind: 'pk' | 'fk' | 'str' | 'text' | 'date' | 'json'
}

interface EntityDef {
  id:     string
  label:  string
  route:  string
  fields: FieldDef[]
}

interface RelDef {
  id:       string
  from:     string
  fromCard: string
  fromSide: Side
  to:       string
  toCard:   string
  toSide:   Side
}

// ── Layout constants ────────────────────────────────────────────────────────

const NODE_W   = 218
const HEADER_H = 36
const FIELD_H  = 21
const PAD      = 6

function nodeH(e: EntityDef): number {
  return HEADER_H + PAD + e.fields.length * FIELD_H + PAD
}

// ── Schema (static — no API needed) ────────────────────────────────────────

const ENTITIES: EntityDef[] = [
  {
    id: 'proyecto', label: 'Proyecto', route: '/proyectos',
    fields: [
      { name: 'id',          kind: 'pk'   },
      { name: 'nombre',      kind: 'str'  },
      { name: 'descripcion', kind: 'text' },
      { name: 'usuario_id',  kind: 'fk'   },
      { name: 'meta',        kind: 'json' },
    ],
  },
  {
    id: 'producto', label: 'Producto', route: '/productos',
    fields: [
      { name: 'id',          kind: 'pk'   },
      { name: 'proyecto_id', kind: 'fk'   },
      { name: 'nombre',      kind: 'str'  },
      { name: 'descripcion', kind: 'text' },
      { name: 'meta',        kind: 'json' },
    ],
  },
  {
    id: 'fuente', label: 'Fuente', route: '/fuentes',
    fields: [
      { name: 'id',               kind: 'pk'   },
      { name: 'nombre',           kind: 'str'  },
      { name: 'nombre_corto',     kind: 'str'  },
      { name: 'sector',           kind: 'text' },
      { name: 'es_fuente_oficial', kind: 'str' },
    ],
  },
  {
    id: 'dataset', label: 'Dataset', route: '/datasets',
    fields: [
      { name: 'id',           kind: 'pk'   },
      { name: 'fuente_id',    kind: 'fk'   },
      { name: 'nombre',       kind: 'str'  },
      { name: 'descripcion',  kind: 'text' },
      { name: 'periodicidad', kind: 'text' },
      { name: 'vigente',      kind: 'str'  },
    ],
  },
  {
    id: 'edicion_dataset', label: 'EdicionDataset', route: '/ediciones-dataset',
    fields: [
      { name: 'id',                kind: 'pk'   },
      { name: 'dataset_id',       kind: 'fk'   },
      { name: 'nombre',           kind: 'str'  },
      { name: 'fecha_publicacion', kind: 'date' },
    ],
  },
  {
    id: 'distribucion', label: 'Distribucion', route: '/distribuciones',
    fields: [
      { name: 'id',                  kind: 'pk'   },
      { name: 'edicion_dataset_id',  kind: 'fk'   },
      { name: 'descriptor',          kind: 'str'  },
      { name: 'url',                 kind: 'str'  },
    ],
  },
  {
    id: 'base_de_datos', label: 'BaseDeDatos', route: '/bases-de-datos',
    fields: [
      { name: 'id',                  kind: 'pk'   },
      { name: 'dataset_id',          kind: 'fk'   },
      { name: 'db_nombre',           kind: 'str'  },
      { name: 'descripcion_esquema', kind: 'json' },
      { name: 'meta',                kind: 'json' },
    ],
  },
  {
    id: 'informacion_tablas', label: 'InformacionTablas', route: '/informacion-tablas',
    fields: [
      { name: 'id',               kind: 'pk'   },
      { name: 'base_de_datos_id', kind: 'fk'   },
      { name: 'nombre',           kind: 'str'  },
      { name: 'descripcion',      kind: 'text' },
      { name: 'meta',             kind: 'json' },
    ],
  },
  {
    id: 'producto_tabla', label: 'ProductoTabla', route: '/producto-tablas',
    fields: [
      { name: 'id',                    kind: 'pk'   },
      { name: 'producto_id',           kind: 'fk'   },
      { name: 'informacion_tablas_id', kind: 'fk'   },
      { name: 'observaciones',         kind: 'text' },
    ],
  },
  {
    id: 'archivo', label: 'Archivo', route: '/archivos',
    fields: [
      { name: 'id',              kind: 'pk'   },
      { name: 'distribucion_id', kind: 'fk'   },
      { name: 'nombre_archivo',  kind: 'str'  },
      { name: 'rol_archivo',     kind: 'text' },
      { name: 'tamano_bytes',    kind: 'str'  },
    ],
  },
]

const RELATIONS: RelDef[] = [
  { id: 'r1',  from: 'proyecto',         fromCard: '1', fromSide: 'bottom', to: 'producto',           toCard: 'N', toSide: 'top'    },
  { id: 'r2',  from: 'fuente',           fromCard: '1', fromSide: 'bottom', to: 'dataset',            toCard: 'N', toSide: 'top'    },
  { id: 'r3',  from: 'dataset',          fromCard: '1', fromSide: 'bottom', to: 'edicion_dataset',    toCard: 'N', toSide: 'top'    },
  { id: 'r4',  from: 'edicion_dataset',  fromCard: '1', fromSide: 'bottom', to: 'distribucion',       toCard: 'N', toSide: 'top'    },
  { id: 'r5',  from: 'distribucion',     fromCard: '1', fromSide: 'bottom', to: 'archivo',            toCard: 'N', toSide: 'top'    },
  { id: 'r6',  from: 'dataset',          fromCard: '1', fromSide: 'right',  to: 'base_de_datos',      toCard: 'N', toSide: 'left'   },
  { id: 'r7',  from: 'base_de_datos',    fromCard: '1', fromSide: 'bottom', to: 'informacion_tablas', toCard: 'N', toSide: 'top'    },
  { id: 'r8',  from: 'producto',         fromCard: 'N', fromSide: 'right',  to: 'producto_tabla',     toCard: 'N', toSide: 'left'   },
  { id: 'r9',  from: 'informacion_tablas', fromCard: 'N', fromSide: 'right', to: 'producto_tabla',    toCard: 'N', toSide: 'bottom' },
]

const INITIAL_POS: Record<string, Pos> = {
  proyecto:            { x: 60,   y: 60   },
  producto:            { x: 60,   y: 310  },
  fuente:              { x: 400,  y: 60   },
  dataset:             { x: 400,  y: 280  },
  edicion_dataset:     { x: 400,  y: 510  },
  distribucion:        { x: 400,  y: 710  },
  base_de_datos:       { x: 740,  y: 280  },
  informacion_tablas:  { x: 740,  y: 510  },
  producto_tabla:      { x: 280,  y: 510  },
  archivo:             { x: 400,  y: 910  },
}

const ENTITY_MAP = Object.fromEntries(ENTITIES.map(e => [e.id, e]))

// ── Visual tokens ───────────────────────────────────────────────────────────

const KIND_LABEL: Record<FieldDef['kind'], string> = {
  pk:   'PK',
  fk:   'FK',
  str:  'string',
  text: 'text?',
  date: 'date',
  json: 'json',
}

const KIND_COLOR: Record<FieldDef['kind'], string> = {
  pk:   '#5C2472',
  fk:   '#c2410c',
  str:  '#6b7280',
  text: '#9ca3af',
  date: '#1d4ed8',
  json: '#92400e',
}

// ── Geometry helpers ────────────────────────────────────────────────────────

function connPt(id: string, side: Side, pos: Record<string, Pos>): Pos {
  const { x, y } = pos[id]
  const h = nodeH(ENTITY_MAP[id])
  if (side === 'top')    return { x: x + NODE_W / 2, y }
  if (side === 'bottom') return { x: x + NODE_W / 2, y: y + h }
  if (side === 'left')   return { x, y: y + h / 2 }
  return                        { x: x + NODE_W, y: y + h / 2 }
}

function sideVec(side: Side, d: number): Pos {
  if (side === 'top')    return { x: 0, y: -d }
  if (side === 'bottom') return { x: 0, y:  d }
  if (side === 'left')   return { x: -d, y: 0 }
  return                        { x:  d, y: 0 }
}

function makePath(fp: Pos, fs: Side, tp: Pos, ts: Side): string {
  const D  = 70
  const o1 = sideVec(fs, D)
  const o2 = sideVec(ts, D)
  const c1 = { x: fp.x + o1.x, y: fp.y + o1.y }
  const c2 = { x: tp.x + o2.x, y: tp.y + o2.y }
  return `M ${fp.x} ${fp.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${tp.x} ${tp.y}`
}

function labelPos(pt: Pos, side: Side): Pos {
  const along = sideVec(side, 20)
  const perp  = side === 'top' || side === 'bottom' ? { x: 13, y: 0 } : { x: 0, y: -12 }
  return { x: pt.x + along.x + perp.x, y: pt.y + along.y + perp.y }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function EntidadesPage() {
  const navigate = useNavigate()

  const [positions, setPositions] = useState<Record<string, Pos>>({ ...INITIAL_POS })
  const [dragging, setDragging]   = useState<{
    id: string; startX: number; startY: number; origX: number; origY: number
  } | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hasDraggedRef = useRef(false)

  useEffect(() => {
    if (!dragging) return

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - dragging.startX
      const dy = e.clientY - dragging.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDraggedRef.current = true
      setPositions(prev => ({
        ...prev,
        [dragging.id]: {
          x: Math.max(8, dragging.origX + dx),
          y: Math.max(8, dragging.origY + dy),
        },
      }))
    }

    const onUp = () => setDragging(null)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [dragging])

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    hasDraggedRef.current = false
    setDragging({
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX:  positions[id].x,
      origY:  positions[id].y,
    })
  }

  const handleNodeClick = (route: string) => {
    if (!hasDraggedRef.current) navigate(route)
  }

  const svgW = Math.max(980,  ...ENTITIES.map(e => positions[e.id].x + NODE_W + 60))
  const svgH = Math.max(1000, ...ENTITIES.map(e => positions[e.id].y + nodeH(e)  + 60))

  const isRelHi = (r: RelDef) =>
    hoveredId !== null && (r.from === hoveredId || r.to === hoveredId)

  const isConnected = (id: string) =>
    hoveredId !== null &&
    hoveredId !== id &&
    RELATIONS.some(r => (r.from === hoveredId && r.to === id) || (r.to === hoveredId && r.from === id))

  return (
    <>
      <Topbar
        title="Entidades"
        actions={
          <button
            onClick={() => setPositions({ ...INITIAL_POS })}
            className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Restablecer
          </button>
        }
      />

      <div className="flex-1 overflow-auto bg-neutral-50 relative">
        {/* Hint */}
        <p className="absolute top-3 right-4 text-xs text-gray-400 pointer-events-none select-none">
          Arrastra · Clic para abrir
        </p>

        <svg
          width={svgW}
          height={svgH}
          style={{ display: 'block', userSelect: 'none', cursor: dragging ? 'grabbing' : 'default' }}
        >
          <defs>
            {/* Dot-grid background */}
            <pattern id="erd-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#d1d5db" />
            </pattern>

            {/* Arrow markers */}
            <marker id="arr"    markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#b0b8c4" />
            </marker>
            <marker id="arr-hi" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#FF8300" />
            </marker>
          </defs>

          {/* Background */}
          <rect width="100%" height="100%" fill="url(#erd-dots)" />

          {/* ── Edges ── */}
          {RELATIONS.map(rel => {
            const hi  = isRelHi(rel)
            const fp  = connPt(rel.from, rel.fromSide, positions)
            const tp  = connPt(rel.to,   rel.toSide,   positions)
            const d   = makePath(fp, rel.fromSide, tp, rel.toSide)
            const fLbl = labelPos(fp, rel.fromSide)
            const tLbl = labelPos(tp, rel.toSide)
            const isNN = rel.fromCard === 'N' && rel.toCard === 'N'

            return (
              <g key={rel.id}>
                {/* Fat transparent hit area */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={18} />
                {/* Visible line */}
                <path
                  d={d}
                  fill="none"
                  stroke={hi ? '#FF8300' : '#c4cad4'}
                  strokeWidth={hi ? 2 : 1.5}
                  strokeDasharray={isNN ? '5 3' : undefined}
                  markerEnd={`url(#${hi ? 'arr-hi' : 'arr'})`}
                />
                {/* Cardinality */}
                <text x={fLbl.x} y={fLbl.y} fontSize="11" fontFamily="monospace"
                  fill={hi ? '#FF8300' : '#a8b0bb'}
                  textAnchor="middle" dominantBaseline="middle"
                >
                  {rel.fromCard}
                </text>
                <text x={tLbl.x} y={tLbl.y} fontSize="11" fontFamily="monospace"
                  fill={hi ? '#FF8300' : '#a8b0bb'}
                  textAnchor="middle" dominantBaseline="middle"
                >
                  {rel.toCard}
                </text>
              </g>
            )
          })}

          {/* ── Nodes ── */}
          {ENTITIES.map(entity => {
            const pos  = positions[entity.id]
            const h    = nodeH(entity)
            const isHv = hoveredId === entity.id
            const isCn = isConnected(entity.id)

            const borderColor = isHv ? '#5C2472' : isCn ? '#FF8300' : '#dde1e8'
            const borderWidth = isHv || isCn ? 2 : 1

            return (
              <g
                key={entity.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: dragging?.id === entity.id ? 'grabbing' : 'grab' }}
                onPointerDown={e => handlePointerDown(e, entity.id)}
                onClick={() => handleNodeClick(entity.route)}
                onMouseEnter={() => setHoveredId(entity.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Drop shadow */}
                <rect x={3} y={3} rx={7} width={NODE_W} height={h} fill="rgba(0,0,0,0.06)" />

                {/* Body */}
                <rect
                  rx={7} width={NODE_W} height={h}
                  fill="white"
                  stroke={borderColor}
                  strokeWidth={borderWidth}
                />

                {/* Header (rounded top + flat bottom fill) */}
                <rect rx={7} width={NODE_W} height={HEADER_H} fill={isHv ? '#4a1d5e' : '#5C2472'} />
                <rect y={HEADER_H - 7} width={NODE_W} height={7} fill={isHv ? '#4a1d5e' : '#5C2472'} />

                {/* Entity name */}
                <text
                  x={12} y={HEADER_H / 2 + 1}
                  fontSize="13" fontWeight="600" fill="white"
                  dominantBaseline="middle"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.01em' }}
                >
                  {entity.label}
                </text>

                {/* Navigate hint */}
                <text
                  x={NODE_W - 11} y={HEADER_H / 2 + 1}
                  fontSize="11" fill="rgba(255,255,255,0.45)"
                  textAnchor="end" dominantBaseline="middle"
                >
                  ↗
                </text>

                {/* Fields */}
                {entity.fields.map((field, i) => {
                  const fy = HEADER_H + PAD + i * FIELD_H + FIELD_H / 2 + 1
                  return (
                    <g key={field.name}>
                      {i > 0 && (
                        <line
                          x1={10} y1={HEADER_H + PAD + i * FIELD_H}
                          x2={NODE_W - 10} y2={HEADER_H + PAD + i * FIELD_H}
                          stroke="#f0f2f5" strokeWidth={1}
                        />
                      )}
                      <text
                        x={10} y={fy}
                        fontSize="10"
                        fontFamily="'Courier New', Courier, monospace"
                        fill={field.kind === 'pk' ? '#5C2472' : field.kind === 'fk' ? '#9a3412' : '#3d4552'}
                        fontWeight={field.kind === 'pk' ? '700' : '400'}
                        dominantBaseline="middle"
                      >
                        {field.name}
                      </text>
                      <text
                        x={NODE_W - 8} y={fy}
                        fontSize="9"
                        fontFamily="'Courier New', Courier, monospace"
                        fill={KIND_COLOR[field.kind]}
                        textAnchor="end"
                        dominantBaseline="middle"
                        opacity="0.9"
                      >
                        {KIND_LABEL[field.kind]}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
    </>
  )
}
