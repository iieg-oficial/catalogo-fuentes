export type UserRole = 'admin' | 'maintainer' | 'viewer'

export interface User {
  id: string
  email: string
  role: UserRole
  is_active: boolean
}

export interface Proyecto {
  id: string
  nombre: string
  descripcion: string | null
  meta: Record<string, unknown>
}

export interface Producto {
  id: string
  proyecto_id: string | null
  nombre: string
  descripcion: string | null
  meta: Record<string, unknown>
  proyecto: Proyecto | null
}

export interface BaseDeDatos {
  id: string
  nombre: string
  descripcion: string | null
  tema: string | null
  frecuencia_actualizacion: string | null
  meta: Record<string, unknown>
}

export interface Tabla {
  id: string
  base_de_datos_id: string | null
  nombre: string
  campos: Array<Record<string, unknown>>
  meta: Record<string, unknown>
  base_de_datos: BaseDeDatos | null
  productos: Producto[]
}

export interface Instrumento {
  id: string
  base_de_datos_id: string | null
  nombre: string
  descripcion: string | null
  fecha_publicacion: string | null
  meta: Record<string, unknown>
  base_de_datos?: BaseDeDatos
  tablas?: Tabla[]
}

export interface Url {
  id: string
  instrumento_id: string | null
  url: string
  meta: Record<string, unknown>
  instrumento?: Instrumento
}

export interface Archivo {
  id: string
  url_id: string | null
  descripcion: string | null
  fecha_publicacion: string | null
  fecha_fuente: string | null
  meta: Record<string, unknown>
  url_ref?: Url
}

// Detail types — returned by GET /{id} endpoints, include children
export interface ProyectoDetail extends Proyecto {
  productos: Omit<Producto, 'proyecto'>[]
}

export interface ProductoDetail extends Producto {
  tablas: Tabla[]
}

export interface BaseDeDatosDetail extends BaseDeDatos {
  tablas: Tabla[]
  instrumentos: Instrumento[]
}

export interface InstrumentoDetail extends Instrumento {
  urls: Url[]
}

export interface UrlDetail extends Url {
  archivos: Archivo[]
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export type CatalogLevel =
  | 'proyectos'
  | 'productos'
  | 'tablas'
  | 'bases-de-datos'
  | 'instrumentos'
  | 'urls'
  | 'archivos'
