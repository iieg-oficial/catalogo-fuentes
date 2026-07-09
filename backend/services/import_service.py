import csv
import io
import logging
import uuid

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from import_config import IMPORT_CONFIGS, EntityImportConfig, FkResolver
from schemas.import_ import ImportResult, ImportSkipped
from utils.normalize import normalizar

logger = logging.getLogger(__name__)

MAX_ROWS = 5000
MAX_BYTES = 5 * 1024 * 1024
LIMITE_MENSAJE = (
    f"El archivo excede el límite de {MAX_ROWS} filas / "
    f"{MAX_BYTES // (1024 * 1024)} MB. Dividilo e intentá de nuevo."
)

# Mapa de parseo de celdas booleanas de CSV: valores reconocidos tras
# normalizar() (minúsculas, sin acentos, sin espacios extremos).
BOOLEANOS_VERDADEROS = {"true", "1", "si", "verdadero"}
BOOLEANOS_FALSOS = {"false", "0", "no", "falso"}


class ImportValidationError(Exception):
    """Error de validación a nivel archivo (formato, límite, columnas)."""

    def __init__(self, mensaje: str):
        self.mensaje = mensaje
        super().__init__(mensaje)


class ImportBlockedError(Exception):
    """Error que bloquea el import completo (a nivel fila o a nivel entidad)."""

    def __init__(self, fila: int | None, motivo: str, mensaje: str):
        self.fila = fila
        self.motivo = motivo
        self.mensaje = mensaje
        super().__init__(mensaje)


def _validar_formato_y_limite(file_bytes: bytes, filename: str) -> None:
    if not filename.lower().endswith(".csv"):
        raise ImportValidationError("Formato no soportado: solo se aceptan archivos .csv")
    if len(file_bytes) > MAX_BYTES:
        raise ImportValidationError(LIMITE_MENSAJE)


def _decodificar(file_bytes: bytes) -> str:
    """Decodifica el archivo, eliminando BOM UTF-8 si está presente.

    Args:
        file_bytes: Contenido crudo del archivo.

    Returns:
        Texto decodificado.
    """
    try:
        return file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1")


def _parsear_filas(texto: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(texto))
    filas = list(reader)
    if len(filas) > MAX_ROWS:
        raise ImportValidationError(LIMITE_MENSAJE)
    return filas


def _validar_columnas_requeridas(filas: list[dict[str, str]], config: EntityImportConfig) -> None:
    if not filas:
        raise ImportValidationError("El archivo no contiene filas de datos.")
    columnas_presentes = set(filas[0].keys())
    faltantes = [col for col in config.required_columns if col not in columnas_presentes]
    if faltantes:
        raise ImportValidationError(
            f"Faltan columnas requeridas: {', '.join(faltantes)}"
        )


def _campos_booleanos(config: EntityImportConfig) -> set[str]:
    """Determina qué campos del schema Create son booleanos.

    Args:
        config: configuración declarativa de la entidad.

    Returns:
        Conjunto de nombres de campo (del schema) cuyo tipo es bool.
    """
    return {
        campo
        for campo in config.column_to_field.values()
        if config.create_schema.model_fields[campo].annotation is bool
    }


def _parsear_booleano(valor: str, idx: int, columna: str) -> bool:
    """Parsea una celda CSV a bool según el mapa de valores reconocidos.

    Args:
        valor: celda cruda del CSV.
        idx: número de fila (para el mensaje de error).
        columna: nombre de columna CSV (para el mensaje de error).

    Returns:
        Valor booleano interpretado.

    Raises:
        ImportBlockedError: si el valor no es reconocido.
    """
    clave = normalizar(valor)
    if clave in BOOLEANOS_VERDADEROS:
        return True
    if clave in BOOLEANOS_FALSOS:
        return False
    raise ImportBlockedError(
        fila=idx,
        motivo="valor_booleano_invalido",
        mensaje=f"Fila {idx}: valor booleano inválido en '{columna}': '{valor}'",
    )


async def _construir_indice_fk(
    db: AsyncSession, entidad_padre: str, fk_resolver: FkResolver
) -> dict[str, uuid.UUID]:
    """Construye el índice normalizado de una entidad padre para resolver FKs.

    Args:
        db: sesión de base de datos activa.
        entidad_padre: nombre de la entidad padre, para mensajes de error.
        fk_resolver: configuración de la FK a resolver.

    Returns:
        Diccionario de clave normalizada a id de la entidad padre.

    Raises:
        ImportBlockedError: si dos registros distintos normalizan a la misma
            clave (ambigüedad detectada a nivel entidad, no de fila del CSV).
    """
    result = await db.execute(
        select(
            fk_resolver.parent_model.id,
            getattr(fk_resolver.parent_model, fk_resolver.parent_key_field),
        )
    )
    indice: dict[str, uuid.UUID] = {}
    for parent_id, parent_value in result.all():
        clave = normalizar(parent_value)
        if clave in indice and indice[clave] != parent_id:
            raise ImportBlockedError(
                fila=None,
                motivo="ambiguedad",
                mensaje=(
                    f"Ambigüedad en {entidad_padre}: '{parent_value}' coincide con "
                    "más de un registro tras normalizar."
                ),
            )
        indice[clave] = parent_id
    return indice


async def import_entity(
    entidad: str, file_bytes: bytes, filename: str, db: AsyncSession
) -> ImportResult:
    """Importa un CSV para la entidad dada, en una única transacción todo-o-nada.

    Nota sobre deduplicación: la clave de duplicados (`natural_key`) puede
    incluir el `target_field` de una FK opcional. Si esa FK viene vacía en
    dos filas distintas, ambas normalizan a la misma parte vacía de la
    clave y, junto con el resto de campos coincidentes, se consideran
    duplicadas (la segunda se omite). Es un tradeoff conocido del dedup por
    clave natural compuesta: para evitarlo, importá primero las entidades
    padre para que las FKs opcionales resuelvan antes del import del hijo.
    """
    config = IMPORT_CONFIGS[entidad]

    _validar_formato_y_limite(file_bytes, filename)
    texto = _decodificar(file_bytes)
    filas = _parsear_filas(texto)
    _validar_columnas_requeridas(filas, config)

    fk_indices: dict[str, dict[str, uuid.UUID]] = {}
    for fk in config.fks:
        fk_indices[fk.csv_column] = await _construir_indice_fk(
            db, fk.parent_model.__name__.lower(), fk
        )

    result_existente = await db.execute(select(config.model))
    existentes = result_existente.scalars().all()
    claves_existentes: set[tuple] = set()
    for obj in existentes:
        claves_existentes.add(
            tuple(normalizar(str(getattr(obj, campo) or "")) for campo in config.natural_key)
        )

    claves_vistas: set[tuple] = set(claves_existentes)
    nuevos_objetos = []
    omitidos: list[ImportSkipped] = []
    campos_bool = _campos_booleanos(config)
    columna_por_campo = {campo: columna for columna, campo in config.column_to_field.items()}
    columna_display = columna_por_campo.get(config.natural_key[0], config.natural_key[0]) if config.natural_key else ""

    for idx, fila in enumerate(filas, start=2):
        if all(not (valor or "").strip() for valor in fila.values()):
            continue  # fila completamente vacía: se omite sin crear registro ni bloquear

        datos: dict = {}
        for columna, campo in config.column_to_field.items():
            valor = fila.get(columna)
            if valor is None or not valor.strip():
                continue  # celda vacía: se omite la clave para aplicar el default del schema
            if campo in campos_bool:
                datos[campo] = _parsear_booleano(valor, idx, columna)
            else:
                datos[campo] = valor

        for campo_requerido in config.required_columns:
            valor_crudo = fila.get(campo_requerido)
            if campo_requerido in config.column_to_field:
                if not valor_crudo or not valor_crudo.strip():
                    raise ImportBlockedError(
                        fila=idx,
                        motivo="campo_requerido",
                        mensaje=f"Fila {idx}: falta el campo requerido '{campo_requerido}'",
                    )

        for fk in config.fks:
            valor_fk = fila.get(fk.csv_column)
            vacio = not valor_fk or not valor_fk.strip()
            if vacio:
                if fk.required:
                    raise ImportBlockedError(
                        fila=idx,
                        motivo="campo_requerido",
                        mensaje=f"Fila {idx}: falta el campo requerido '{fk.csv_column}'",
                    )
                continue  # FK opcional vacía: no se setea target_field
            clave_fk = normalizar(valor_fk)
            indice = fk_indices[fk.csv_column]
            if clave_fk not in indice:
                entidad_padre = fk.parent_model.__name__.lower()
                raise ImportBlockedError(
                    fila=idx,
                    motivo="fk_no_resuelta",
                    mensaje=f"Fila {idx}: no se encontró {entidad_padre} '{valor_fk}'",
                )
            datos[fk.target_field] = indice[clave_fk]

        clave_natural = tuple(
            normalizar(str(datos.get(campo) or "")) for campo in config.natural_key
        )
        if clave_natural in claves_vistas:
            omitidos.append(
                ImportSkipped(
                    fila=idx, motivo="duplicado", valor=fila.get(columna_display, "") or ""
                )
            )
            continue
        claves_vistas.add(clave_natural)

        try:
            validado = config.create_schema(**datos)
        except ValidationError as error:
            primer_error = error.errors()[0]
            campo_error = ".".join(str(parte) for parte in primer_error["loc"])
            raise ImportBlockedError(
                fila=idx,
                motivo="parseo",
                mensaje=f"Fila {idx}: {campo_error}: {primer_error['msg']}",
            ) from error
        except Exception as error:  # noqa: BLE001 — defensivo ante errores no-Pydantic
            raise ImportBlockedError(
                fila=idx,
                motivo="parseo",
                mensaje=f"Fila {idx}: no se pudo leer la fila ({error})",
            ) from error

        nuevos_objetos.append(config.model(**validado.model_dump()))

    for obj in nuevos_objetos:
        db.add(obj)
    await db.commit()

    return ImportResult(entidad=entidad, creados=len(nuevos_objetos), omitidos_duplicados=omitidos)
