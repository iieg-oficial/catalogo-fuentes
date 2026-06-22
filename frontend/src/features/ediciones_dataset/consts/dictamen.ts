// Catálogo de dictamen (A1..C). Debe coincidir con backend/consts/dictamen.py.

export const DICTAMEN_DESCRIPCIONES: Record<string, string> = {
  A1: 'Apta para uso institucional pleno',
  A2: 'Apta para uso institucional casi pleno, con nota aclaratoria obligatoria',
  A3: 'Apta para uso institucional pleno, con pendientes de gestión documental o aclaratoria',
  A4: 'Apta para uso institucional pleno, con alto requerimiento laboral',
  A5: 'Apta para uso específico, colaboración o análisis técnico controlado',
  B1: 'Apta sólo para respuestas de solicitudes específicas, requiere advertencia',
  B2: 'Apta sólo para exploración o consumo interno',
  C: 'No apta para uso institucional',
}

// En el selector se muestra el código y la descripción.
export const DICTAMEN_OPTIONS = Object.entries(DICTAMEN_DESCRIPCIONES).map(
  ([value, desc]) => ({ value, label: `${value}: ${desc}` }),
)

const badgeBase = 'inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium'

// A1..A5 verde, B1/B2 amarillo, C naranja rojizo.
export function dictamenBadgeClass(code: string): string {
  if (code.startsWith('A')) return `${badgeBase} bg-green-500/10 text-green-700`
  if (code.startsWith('B')) return `${badgeBase} bg-yellow-500/15 text-yellow-700`
  return `${badgeBase} bg-orange-600/15 text-orange-700`
}

// Puntaje: >=80 verde, 50-79 amarillo, <50 naranja rojizo.
export function puntajeBadgeClass(puntaje: number): string {
  if (puntaje >= 80) return `${badgeBase} bg-green-500/10 text-green-700`
  if (puntaje >= 50) return `${badgeBase} bg-yellow-500/15 text-yellow-700`
  return `${badgeBase} bg-orange-600/15 text-orange-700`
}
