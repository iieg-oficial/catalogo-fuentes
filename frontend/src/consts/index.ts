export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const CATALOG_LEVELS = [
  { key: 'proyectos', label: 'Proyectos', path: '/proyectos' },
  { key: 'productos', label: 'Productos', path: '/productos' },
  { key: 'tablas', label: 'Tablas', path: '/tablas' },
  { key: 'bases-de-datos', label: 'Bases de datos', path: '/bases-de-datos' },
  { key: 'instrumentos', label: 'Instrumentos', path: '/instrumentos' },
  { key: 'urls', label: 'URLs', path: '/urls' },
  { key: 'archivos', label: 'Archivos', path: '/archivos' },
] as const

export const TOKEN_KEY = 'auth_token'
