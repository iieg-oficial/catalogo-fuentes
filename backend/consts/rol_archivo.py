# Catálogo de rol_archivo para archivos.
# Lista cerrada y fija de roles posibles para un archivo dentro de una distribución.

ROL_ARCHIVO_DESCRIPCIONES: dict[str, str] = {
    "datos": "Datos",
    "catalogo": "Catálogo",
    "diccionario_datos": "Diccionario de datos",
    "documentacion": "Documentación",
    "sistema_referencia": "Sistema de referencia",
    "codificacion": "Codificación",
    "geometria": "Geometría",
    "metadato": "Metadato",
    "script": "Script",
    "otro": "Otro",
}

# Valores válidos, usados para el CHECK constraint y validación.
ROL_ARCHIVO_VALUES: list[str] = list(ROL_ARCHIVO_DESCRIPCIONES.keys())
