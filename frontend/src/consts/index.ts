export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const CATALOG_LEVELS = [
  { key: 'proyectos', label: 'Proyectos', path: '/proyectos' },
  { key: 'productos', label: 'Productos', path: '/productos' },
  { key: 'producto-tablas', label: 'Producto Tablas', path: '/producto-tablas' },
  { key: 'informacion-tablas', label: 'Información Tablas', path: '/informacion-tablas' },
  { key: 'bases-de-datos', label: 'Bases de datos', path: '/bases-de-datos' },
  { key: 'datasets', label: 'Datasets', path: '/datasets' },
  { key: 'fuentes', label: 'Fuentes', path: '/fuentes' },
  { key: 'ediciones-dataset', label: 'Ediciones', path: '/ediciones-dataset' },
  { key: 'distribuciones', label: 'Distribuciones', path: '/distribuciones' },
  { key: 'archivos', label: 'Archivos', path: '/archivos' },
] as const

export const TOKEN_KEY = 'auth_token'
