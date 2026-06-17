export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const CATALOG_LEVELS = [
  { key: 'proyectos', label: 'Proyectos', path: '/proyectos' },
  { key: 'productos', label: 'Productos', path: '/productos' },
  { key: 'informacion-tablas', label: 'Información Tablas', path: '/informacion-tablas' },
  { key: 'bases-de-datos', label: 'Bases de datos', path: '/bases-de-datos' },
  { key: 'archivos', label: 'Archivos', path: '/archivos' },
  { key: 'distribuciones', label: 'Distribuciones', path: '/distribuciones' },
  { key: 'fuentes', label: 'Fuentes', path: '/fuentes' },
  { key: 'datasets', label: 'Datasets', path: '/datasets' },
  { key: 'ediciones-dataset', label: 'Ediciones', path: '/ediciones-dataset' },
] as const

export const TOKEN_KEY = 'auth_token'
