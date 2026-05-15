export const ESTADO_TONE: Record<string, { bg: string; fg: string; dot: string }> = {
  Activo:   { bg: '#EEFBF5', fg: '#067647', dot: '#10b981' },
  Pendiente:{ bg: '#FFF6EE', fg: '#B8580E', dot: '#FF8300' },
  Archivado:{ bg: '#F4F4F5', fg: '#52525B', dot: '#a1a1aa' },
}

export const SECTION_LABEL_COLOR = '#6E6279'

export const PRIORITY_LEVELS = [
  { label: 'Urgente',       color: '#dc2626' },
  { label: 'Alta',          color: '#f97316' },
  { label: 'Media',         color: '#f59e0b' },
  { label: 'Baja',          color: '#22c55e' },
  { label: 'Sin prioridad', color: '#94a3b8' },
]
