// Catálogo de dictamen (A1..A4, B, C). Debe coincidir con backend/consts/dictamen.py.

export const DICTAMEN_DESCRIPCIONES: Record<string, string> = {
  A1: 'Apta para uso institucional pleno',
  A2: 'Apta para uso institucional pleno, con nota aclaratoria obligatoria',
  A3: 'Apta para uso institucional pleno, con pendientes de gestión documental o aclaratoria',
  A4: 'Apta para uso institucional pleno, con alto requerimiento laboral',
  B: 'Apta para uso específico, colaboración o análisis técnico controlado',
  C: 'No apta para uso institucional',
}

// En el selector se muestra el código y la descripción.
export const DICTAMEN_OPTIONS = Object.entries(DICTAMEN_DESCRIPCIONES).map(
  ([value, desc]) => ({ value, label: `${value}: ${desc}` }),
)

const badgeBase = 'inline-flex items-center px-2 py-0.5 rounded-sm text-[12px] font-medium'

// A1..A4 verde, B amarillo, C naranja rojizo.
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
