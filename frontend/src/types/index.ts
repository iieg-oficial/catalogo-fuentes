export interface Permiso {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
  updated_at: string | null
}

export interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
  updated_at: string | null
}

export interface RolDetail extends Rol {
  permisos: Permiso[]
}

export interface Usuario {
  id: string
  nombre: string | null
  correo: string
  activo: boolean
  rol_id: string | null
  rol: Rol | null
  permisos: string[]
  created_at: string
  updated_at: string | null
}

export interface Proyecto {
  id: string
  nombre: string
  descripcion: string | null
  meta: Record<string, unknown>
  usuario_id: string | null
  created_at: string
  updated_at: string | null
}

export interface ProyectoDetail extends Proyecto {
  productos: Producto[]
}

export interface Producto {
  id: string
  proyecto_id: string | null
  nombre: string
  descripcion: string | null
  meta: Record<string, unknown>
  proyecto: Proyecto | null
  created_at: string
  updated_at: string | null
}

export interface ProductoDetail extends Producto {
  producto_tablas: ProductoTabla[]
}

export interface Fuente {
  id: string
  nombre: string
  nombre_corto: string | null
  sector: string | null
  ambito: string | null
  url: string | null
  descripcion: string | null
  es_fuente_oficial: boolean
  es_publicador: boolean
  jurisdiccion: string | null
  url_terminos_uso: string | null
  url_aviso_privacidad: string | null
  contacto_institucional: string | null
  created_at: string
  updated_at: string | null
}

export interface FuenteDetail extends Fuente {
  datasets: Dataset[]
}

export interface Dataset {
  id: string
  nombre: string
  nombre_corto: string | null
  descripcion: string | null
  identificador_persistente: string | null
  periodicidad: string | null
  vigente: boolean
  url_pagina_principal: string | null
  url_metodologia_general: string | null
  url_metadatos_general: string | null
  desagregacion_geografica: string | null
  cobertura_temporal_general: string | null
  unidad_observacion: string | null
  tema_principal: string | null
  proposito: string | null
  fecha_inicio_disponibilidad: string | null
  fecha_fin_disponibilidad: string | null
  observaciones_dataset: string | null
  etiquetas: Record<string, unknown> | null
  url_normativa_o_marco_legal: string | null
  fuente_id: string | null
  fuente: Fuente | null
  created_at: string
  updated_at: string | null
}

export interface DatasetDetail extends Dataset {
  ediciones: EdicionDataset[]
  bases_de_datos: BaseDeDatos[]
}

export interface DatasetRef {
  id: string
  nombre: string
}

export interface EdicionDatasetRef {
  id: string
  nombre: string
}

export interface DistribucionRef {
  id: string
  descriptor: string | null
}

export interface BaseDeDatosRef {
  id: string
  db_nombre: string
}

export interface EdicionDataset {
  id: string
  nombre: string
  fecha_publicacion: string | null
  periodo_referencia_inicio: string | null
  periodo_referencia_fin: string | null
  tipo_periodo_referencia: string | null
  fecha_levantamiento_inicio: string | null
  fecha_levantamiento_fin: string | null
  url_documentacion_edicion: string | null
  url_comunicado_publicacion: string | null
  observaciones_edicion: string | null
  version_publicacion: string | null
  dataset_id: string | null
  dataset: DatasetRef | null
  es_version_corregida: boolean
  created_at: string
  updated_at: string | null
}

export interface EdicionDatasetDetail extends EdicionDataset {
  distribuciones: Distribucion[]
}

export interface Distribucion {
  id: string
  descriptor: string | null
  url: string | null
  requiere_autenticacion: boolean
  requiere_registro: boolean
  es_url_persistente: boolean
  estado_url_ultima_revision: string | null
  observaciones_distribucion: string | null
  edicion_dataset_id: string | null
  edicion_dataset: EdicionDatasetRef | null
  created_at: string
  updated_at: string | null
}

export interface DistribucionDetail extends Distribucion {
  archivos: Archivo[]
}

export interface BaseDeDatos {
  id: string
  db_nombre: string
  descripcion_esquema: Record<string, unknown>
  meta: Record<string, unknown>
  dataset_id: string | null
  dataset: DatasetRef | null
  created_at: string
  updated_at: string | null
}

export interface BaseDeDatosDetail extends BaseDeDatos {
  informacion_tablas: InformacionTablas[]
}

export interface InformacionTablas {
  id: string
  nombre: string
  descripcion: string | null
  meta: Record<string, unknown>
  base_de_datos_id: string | null
  base_de_datos: BaseDeDatosRef | null
  created_at: string
  updated_at: string | null
}

export interface ProductoTabla {
  id: string
  producto_id: string
  informacion_tablas_id: string
  fecha_vinculacion: string | null
  observaciones: string | null
  created_at: string
}

export interface Archivo {
  id: string
  nombre_archivo: string
  ruta_relativa_en_distribucion: string | null
  rol_archivo: string | null
  fecha_ingesta_sistema: string | null
  tamano_bytes: number | null
  hash_sha256: string | null
  archivos_relacionados: Record<string, unknown>
  ruta_almacenamiento: string | null
  observaciones_archivo: string | null
  distribucion_id: string | null
  distribucion: DistribucionRef | null
  created_at: string
  updated_at: string | null
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export type CatalogLevel =
  | 'proyectos'
  | 'productos'
  | 'fuentes'
  | 'datasets'
  | 'ediciones-dataset'
  | 'distribuciones'
  | 'bases-de-datos'
  | 'informacion-tablas'
  | 'archivos'
