// Catálogo de rol_archivo. Debe coincidir con backend/consts/rol_archivo.py.

export const ROL_ARCHIVO_DESCRIPCIONES: Record<string, string> = {
  datos: 'Datos',
  catalogo: 'Catálogo',
  diccionario_datos: 'Diccionario de datos',
  documentacion: 'Documentación',
  sistema_referencia: 'Sistema de referencia',
  codificacion: 'Codificación',
  geometria: 'Geometría',
  metadato: 'Metadato',
  script: 'Script',
  otro: 'Otro',
}

export const ROL_ARCHIVO_OPTIONS = Object.entries(ROL_ARCHIVO_DESCRIPCIONES).map(
  ([value, label]) => ({ value, label }),
)
