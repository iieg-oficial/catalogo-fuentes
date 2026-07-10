import csv
import io
import logging
import uuid
from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from import_config import (
    IMPORT_CONFIGS,
    CompositeFkResolver,
    EntityImportConfig,
    FkResolver,
)
from schemas.import_ import ImportPreviewResult, ImportPreviewRow, ImportResult, ImportSkipped
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


def _validar_columnas_conocidas(
    filas: list[dict[str, str]], config: EntityImportConfig, entidad: str
) -> None:
    """Bloquea el import si el header trae columnas que no pertenecen a la entidad.

    Args:
        filas: filas parseadas del CSV (se usa el header de la primera).
        config: configuración declarativa de la entidad destino.
        entidad: nombre de la entidad, para el mensaje de error.

    Raises:
        ImportBlockedError: si hay columnas en el header que no están en
            column_to_field ni son columnas de FK de la entidad.
    """
    columnas_validas = (
        set(config.column_to_field.keys())
        | {fk.csv_column for fk in config.fks}
        | {parte.csv_column for cfk in config.composite_fks for parte in cfk.parts}
    )
    columnas_presentes = set(filas[0].keys())
    desconocidas = sorted(columnas_presentes - columnas_validas)
    if desconocidas:
        raise ImportBlockedError(
            fila=None,
            motivo="columnas_desconocidas",
            mensaje=(
                f"Columnas no reconocidas para {entidad}: {', '.join(desconocidas)}"
            ),
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
) -> dict[str, tuple[uuid.UUID, str]]:
    """Construye el índice normalizado de una entidad padre para resolver FKs.

    Args:
        db: sesión de base de datos activa.
        entidad_padre: nombre de la entidad padre, para mensajes de error.
        fk_resolver: configuración de la FK a resolver.

    Returns:
        Diccionario de clave normalizada a una tupla (id, valor legible
        original de la entidad padre), este último usado para construir la
        fila anidada del preview.

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
    indice: dict[str, tuple[uuid.UUID, str]] = {}
    for parent_id, parent_value in result.all():
        clave = normalizar(parent_value)
        if clave in indice and indice[clave][0] != parent_id:
            raise ImportBlockedError(
                fila=None,
                motivo="ambiguedad",
                mensaje=(
                    f"Ambigüedad en {entidad_padre}: '{parent_value}' coincide con "
                    "más de un registro tras normalizar."
                ),
            )
        indice[clave] = (parent_id, parent_value)
    return indice


def _leer_ruta(obj: Any, ruta: tuple[str, ...]) -> str:
    """Lee un valor siguiendo una ruta de atributos, tolerando relaciones nulas.

    Args:
        obj: instancia raíz (entidad padre).
        ruta: secuencia de atributos a recorrer, p.ej. ("dataset", "nombre").

    Returns:
        El valor final como string, o "" si algún tramo de la ruta es None.
    """
    valor: Any = obj
    for atributo in ruta:
        if valor is None:
            return ""
        valor = getattr(valor, atributo, None)
    return str(valor) if valor is not None else ""


async def _construir_indice_fk_compuesto(
    db: AsyncSession, resolver: CompositeFkResolver
) -> dict[tuple[str, ...], tuple[uuid.UUID, str]]:
    """Construye el índice por clave compuesta de una entidad padre.

    Precarga las relaciones necesarias para leer los value_path que cruzan
    otras tablas y arma un diccionario de tupla-clave normalizada a
    (id, etiqueta legible).

    Args:
        db: sesión de base de datos activa.
        resolver: configuración de la FK compuesta.

    Returns:
        Diccionario de clave compuesta normalizada a (id, etiqueta legible).

    Raises:
        ImportBlockedError: si dos registros distintos normalizan a la misma
            clave compuesta (ambigüedad a nivel entidad).
    """
    q = select(resolver.parent_model)
    for relacion in resolver.load_relationships:
        q = q.options(selectinload(getattr(resolver.parent_model, relacion)))
    result = await db.execute(q)
    entidad_padre = resolver.parent_model.__name__.lower()
    indice: dict[tuple[str, ...], tuple[uuid.UUID, str]] = {}
    for padre in result.scalars().all():
        valores = [_leer_ruta(padre, parte.value_path) for parte in resolver.parts]
        clave = tuple(normalizar(valor) for valor in valores)
        legible = " · ".join(valor for valor in valores if valor.strip())
        if clave in indice and indice[clave][0] != padre.id:
            raise ImportBlockedError(
                fila=None,
                motivo="ambiguedad",
                mensaje=(
                    f"Ambigüedad en {entidad_padre}: '{legible}' coincide con "
                    "más de un registro tras normalizar."
                ),
            )
        indice[clave] = (padre.id, legible)
    return indice


@dataclass(frozen=True)
class FilasProcesadas:
    """Resultado de validar/resolver/deduplicar un CSV, sin persistir nada.

    Attributes:
        nuevos_objetos: instancias del modelo listas para `db.add`, aún no
            agregadas a la sesión.
        filas_preview: pares (número de fila, datos) de cada fila a crear,
            con los campos propios más las FKs resueltas anidadas (forma
            legible para el preview del frontend).
        omitidos: filas omitidas por duplicado.
    """

    nuevos_objetos: list[Any]
    filas_preview: list[tuple[int, dict[str, Any]]]
    omitidos: list[ImportSkipped]


async def _procesar_filas(
    config: EntityImportConfig, entidad: str, file_bytes: bytes, filename: str, db: AsyncSession
) -> FilasProcesadas:
    """Valida, resuelve FKs y deduplica un CSV, sin persistir cambios.

    Función pura compartida entre el import real y el preview (dry-run):
    ejecuta el mismo pipeline de validación/resolución/dedup y lanza las
    mismas excepciones, pero no hace `db.add` ni `db.commit`.

    Args:
        config: configuración declarativa de la entidad destino.
        entidad: nombre de la entidad destino, usado solo en mensajes de error.
        file_bytes: contenido crudo del archivo CSV.
        filename: nombre del archivo, para validar la extensión.
        db: sesión de base de datos activa (solo lecturas).

    Returns:
        Estructura con los objetos a crear, sus filas de preview y los
        omitidos por duplicado.

    Raises:
        ImportValidationError: error de formato, límite o columnas requeridas.
        ImportBlockedError: bloqueo a nivel fila o entidad (FK, ambigüedad,
            columna desconocida, parseo, campo requerido, booleano inválido).

    Nota sobre deduplicación: la clave de duplicados (`natural_key`) puede
    incluir el `target_field` de una FK opcional. Si esa FK viene vacía en
    dos filas distintas, ambas normalizan a la misma parte vacía de la
    clave y, junto con el resto de campos coincidentes, se consideran
    duplicadas (la segunda se omite). Es un tradeoff conocido del dedup por
    clave natural compuesta: para evitarlo, importá primero las entidades
    padre para que las FKs opcionales resuelvan antes del import del hijo.
    """
    _validar_formato_y_limite(file_bytes, filename)
    texto = _decodificar(file_bytes)
    filas = _parsear_filas(texto)
    _validar_columnas_requeridas(filas, config)
    _validar_columnas_conocidas(filas, config, entidad)

    fk_indices: dict[str, dict[str, tuple[uuid.UUID, str]]] = {}
    for fk in config.fks:
        fk_indices[fk.csv_column] = await _construir_indice_fk(
            db, fk.parent_model.__name__.lower(), fk
        )

    composite_indices: list[dict[tuple[str, ...], tuple[uuid.UUID, str]]] = [
        await _construir_indice_fk_compuesto(db, cfk) for cfk in config.composite_fks
    ]

    result_existente = await db.execute(select(config.model))
    existentes = result_existente.scalars().all()
    claves_existentes: set[tuple] = set()
    for obj in existentes:
        claves_existentes.add(
            tuple(normalizar(str(getattr(obj, campo) or "")) for campo in config.natural_key)
        )

    claves_vistas: set[tuple] = set(claves_existentes)
    nuevos_objetos: list[Any] = []
    filas_preview: list[tuple[int, dict[str, Any]]] = []
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

        fk_legibles: dict[str, str] = {}
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
            parent_id, parent_legible = indice[clave_fk]
            datos[fk.target_field] = parent_id
            fk_legibles[fk.target_field] = parent_legible

        for cfk, indice_compuesto in zip(config.composite_fks, composite_indices):
            valores = [(fila.get(parte.csv_column) or "").strip() for parte in cfk.parts]
            faltantes = [parte.csv_column for parte, valor in zip(cfk.parts, valores) if not valor]
            if faltantes:
                # Clave compuesta incompleta: si es requerida, bloquea; si es
                # opcional, no se resuelve (columnas compartidas con otras FKs
                # pueden venir llenas sin que esta FK esté especificada).
                if cfk.required:
                    raise ImportBlockedError(
                        fila=idx,
                        motivo="campo_requerido",
                        mensaje=f"Fila {idx}: falta el campo requerido '{faltantes[0]}'",
                    )
                continue
            clave_compuesta = tuple(normalizar(valor) for valor in valores)
            if clave_compuesta not in indice_compuesto:
                entidad_padre = cfk.parent_model.__name__.lower()
                combinacion = " · ".join(valor for valor in valores if valor)
                raise ImportBlockedError(
                    fila=idx,
                    motivo="fk_no_resuelta",
                    mensaje=f"Fila {idx}: no se encontró {entidad_padre} '{combinacion}'",
                )
            parent_id, parent_legible = indice_compuesto[clave_compuesta]
            datos[cfk.target_field] = parent_id
            fk_legibles[cfk.target_field] = parent_legible

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

        campos_fk = {fk.target_field for fk in config.fks} | {
            cfk.target_field for cfk in config.composite_fks
        }
        fila_preview: dict[str, Any] = {
            "id": f"preview-{idx}",
            **{campo: valor for campo, valor in validado.model_dump().items() if campo not in campos_fk},
        }
        for fk in config.fks:
            if fk.target_field in fk_legibles:
                relacion = fk.target_field.removesuffix("_id")
                fila_preview[relacion] = {fk.parent_key_field: fk_legibles[fk.target_field]}
        for cfk in config.composite_fks:
            if cfk.target_field in fk_legibles:
                relacion = cfk.target_field.removesuffix("_id")
                legible = fk_legibles[cfk.target_field]
                atributo_primario = cfk.parts[0].value_path[-1]
                # atributo_primario: lo que lee el render del grid (p.ej. .edicion,
                # .distribucion). *_label: la etiqueta compuesta completa.
                fila_preview[relacion] = {atributo_primario: legible, f"{relacion}_label": legible}
        filas_preview.append((idx, fila_preview))

    return FilasProcesadas(
        nuevos_objetos=nuevos_objetos, filas_preview=filas_preview, omitidos=omitidos
    )


async def import_entity(
    entidad: str, file_bytes: bytes, filename: str, db: AsyncSession
) -> ImportResult:
    """Importa un CSV para la entidad dada, en una única transacción todo-o-nada.

    Args:
        entidad: nombre de la entidad destino (clave en `IMPORT_CONFIGS`).
        file_bytes: contenido crudo del archivo CSV.
        filename: nombre del archivo subido.
        db: sesión de base de datos activa.

    Returns:
        Resultado con la cantidad de filas creadas y las omitidas por
        duplicado.
    """
    config = IMPORT_CONFIGS[entidad]
    procesadas = await _procesar_filas(config, entidad, file_bytes, filename, db)

    for obj in procesadas.nuevos_objetos:
        db.add(obj)
    await db.commit()

    return ImportResult(
        entidad=entidad, creados=len(procesadas.nuevos_objetos), omitidos_duplicados=procesadas.omitidos
    )


async def preview_entity(
    entidad: str, file_bytes: bytes, filename: str, db: AsyncSession
) -> ImportPreviewResult:
    """Ejecuta un dry-run del import de un CSV, sin persistir cambios.

    Args:
        entidad: nombre de la entidad destino (clave en `IMPORT_CONFIGS`).
        file_bytes: contenido crudo del archivo CSV.
        filename: nombre del archivo subido.
        db: sesión de base de datos activa (solo lecturas).

    Returns:
        Resultado con las filas que se crearían (con FKs anidadas) y las
        omitidas por duplicado.
    """
    config = IMPORT_CONFIGS[entidad]
    procesadas = await _procesar_filas(config, entidad, file_bytes, filename, db)

    return ImportPreviewResult(
        entidad=entidad,
        a_crear=[
            ImportPreviewRow(fila=idx, datos=datos) for idx, datos in procesadas.filas_preview
        ],
        omitidos_duplicados=procesadas.omitidos,
    )
