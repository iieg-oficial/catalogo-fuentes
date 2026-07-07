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
  informacion_tablas: InformacionTablas[]
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
  contacto_institucional: string | null
  created_at: string
  updated_at: string | null
}

export interface FuenteDetail extends Fuente {
  datasets: Dataset[]
}

export interface TipoDataset {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface TipoPeriodo {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface TipoDeAcceso {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface Dataset {
  id: string
  nombre: string
  nombre_corto: string | null
  descripcion: string | null
  url_persistente: string | null
  periodicidad: string | null
  vigente: boolean
  desagregacion_geografica: string | null
  inicio_cobertura_temporal: string | null
  proposito: string | null
  observaciones_dataset: string | null
  etiquetas: Record<string, unknown> | null
  url_normativa_o_marco_legal: string | null
  nomenclatura_edicion: string | null
  url_terminos_uso: string | null
  url_aviso_privacidad: string | null
  fuente_id: string | null
  fuente: Fuente | null
  tipo_dataset_id: string | null
  tipo_dataset: TipoDatasetRef | null
  created_at: string
  updated_at: string | null
}

export interface DatasetDetail extends Dataset {
  ediciones: EdicionDataset[]
  distribuciones: Distribucion[]
}

export interface DatasetRef {
  id: string
  nombre: string
}

export interface TipoDatasetRef {
  id: string
  nombre: string
}

export interface TipoPeriodoRef {
  id: string
  nombre: string
}

export interface TipoDeAccesoRef {
  id: string
  nombre: string
}

export interface EdicionDatasetRef {
  id: string
  edicion: string
}

export interface DistribucionRef {
  id: string
  distribucion: string | null
}

export interface ArchivoRef {
  id: string
  nombre_archivo: string
}

export interface ProductoRef {
  id: string
  nombre: string
}

export interface BaseDeDatosRef {
  id: string
  db_nombre: string
}

export interface EdicionDataset {
  id: string
  edicion: string
  fecha_publicacion: string | null
  periodo_referencia_inicio: string | null
  periodo_referencia_fin: string | null
  url_metodologia_edicion: string | null
  url_metadatos_edicion: string | null
  observaciones_edicion: string | null
  puntaje: number | null
  dictamen: string | null
  dataset_id: string | null
  dataset: DatasetRef | null
  tipo_periodo_id: string | null
  tipo_periodo: TipoPeriodoRef | null
  created_at: string
  updated_at: string | null
}

export interface EdicionDatasetDetail extends EdicionDataset {
  distribuciones: Distribucion[]
}

export interface Distribucion {
  id: string
  distribucion: string | null
  url: string | null
  requiere_control_de_acceso: boolean
  es_url_persistente: boolean
  observaciones_distribucion: string | null
  edicion_dataset_id: string | null
  edicion_dataset: EdicionDatasetRef | null
  dataset_id: string | null
  dataset: DatasetRef | null
  tipo_de_acceso_id: string | null
  tipo_de_acceso: TipoDeAccesoRef | null
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
  etiquetas: Record<string, unknown> | null
  archivo_id: string | null
  archivo: ArchivoRef | null
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
  producto_id: string | null
  producto: ProductoRef | null
  created_at: string
  updated_at: string | null
}

export interface Archivo {
  id: string
  nombre_archivo: string
  ruta_relativa_en_distribucion: string | null
  rol_archivo: string | null
  fecha_obtencion: string | null
  fecha_ingesta: string | null
  tamano_bytes: number | null
  hash_sha256: string | null
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
