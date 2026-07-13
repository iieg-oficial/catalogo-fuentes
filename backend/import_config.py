from dataclasses import dataclass, field
from typing import Any

from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.dataset import Dataset
from models.distribucion import Distribucion
from models.edicion_dataset import EdicionDataset
from models.fuente import Fuente
from models.informacion_tablas import InformacionTablas
from models.producto import Producto
from models.proyecto import Proyecto
from models.tipo_de_acceso import TipoDeAcceso
from models.tipo_dataset import TipoDataset
from models.tipo_periodo import TipoPeriodo
from schemas.archivo import ArchivoCreate
from schemas.base_de_datos import BaseDeDatosCreate
from schemas.dataset import DatasetCreate
from schemas.distribucion import DistribucionCreate
from schemas.edicion_dataset import EdicionDatasetCreate
from schemas.fuente import FuenteCreate
from schemas.informacion_tablas import InformacionTablasCreate
from schemas.producto import ProductoCreate
from schemas.proyecto import ProyectoCreate


@dataclass(frozen=True)
class FkResolver:
    """Describe cómo resolver una columna CSV contra una entidad padre."""

    csv_column: str
    parent_model: Any
    parent_key_field: str
    target_field: str
    required: bool = False


@dataclass(frozen=True)
class FkKeyPart:
    """Una parte de una clave compuesta para resolver una FK.

    Attributes:
        csv_column: columna en el CSV del hijo que aporta este valor.
        value_path: ruta de atributos en el modelo padre para leer el valor
            equivalente, p.ej. ("distribucion",) o ("dataset", "nombre").
            Permite cruzar relaciones del padre, no solo campos propios.
    """

    csv_column: str
    value_path: tuple[str, ...]


@dataclass(frozen=True)
class CompositeFkResolver:
    """Resuelve una FK del hijo contra el padre por una clave compuesta.

    A diferencia de FkResolver (una columna → un campo), identifica el
    registro padre por la combinación de varias columnas del CSV, lo que
    permite desambiguar padres con valores repetidos en un solo campo.

    Attributes:
        parent_model: modelo de la entidad padre.
        parts: partes de la clave compuesta, en orden.
        target_field: campo FK a setear en el hijo (p.ej. "distribucion_id").
        load_relationships: relaciones del padre a precargar para leer los
            value_path que cruzan otras tablas.
        required: si la FK es obligatoria (bloquea la fila si viene vacía).
    """

    parent_model: Any
    parts: tuple[FkKeyPart, ...]
    target_field: str
    load_relationships: tuple[str, ...] = ()
    required: bool = False


@dataclass(frozen=True)
class EntityImportConfig:
    """Configuración declarativa de import CSV para una entidad."""

    create_schema: Any
    model: Any
    required_columns: list[str]
    column_to_field: dict[str, str]
    fks: list[FkResolver] = field(default_factory=list)
    composite_fks: list[CompositeFkResolver] = field(default_factory=list)
    natural_key: list[str] = field(default_factory=list)


IMPORT_CONFIGS: dict[str, EntityImportConfig] = {
    "proyecto": EntityImportConfig(
        create_schema=ProyectoCreate,
        model=Proyecto,
        required_columns=["nombre"],
        column_to_field={"nombre": "nombre", "descripcion": "descripcion"},
        fks=[],
        natural_key=["nombre"],
    ),
    "producto": EntityImportConfig(
        create_schema=ProductoCreate,
        model=Producto,
        required_columns=["nombre", "proyecto"],
        column_to_field={"nombre": "nombre", "descripcion": "descripcion"},
        fks=[
            FkResolver(
                csv_column="proyecto",
                parent_model=Proyecto,
                parent_key_field="nombre",
                target_field="proyecto_id",
                required=True,
            )
        ],
        natural_key=["nombre", "proyecto_id"],
    ),
    "fuente": EntityImportConfig(
        create_schema=FuenteCreate,
        model=Fuente,
        required_columns=["nombre"],
        column_to_field={
            "nombre": "nombre",
            "nombre_corto": "nombre_corto",
            "sector": "sector",
            "ambito": "ambito",
            "url": "url",
            "descripcion": "descripcion",
            "es_fuente_oficial": "es_fuente_oficial",
            "es_publicador": "es_publicador",
            "contacto_institucional": "contacto_institucional",
        },
        fks=[],
        natural_key=["nombre"],
    ),
    "dataset": EntityImportConfig(
        create_schema=DatasetCreate,
        model=Dataset,
        required_columns=["nombre"],
        column_to_field={
            "nombre": "nombre",
            "nombre_corto": "nombre_corto",
            "descripcion": "descripcion",
            "url_persistente": "url_persistente",
            "periodicidad": "periodicidad",
            "vigente": "vigente",
            "desagregacion_geografica": "desagregacion_geografica",
            "inicio_cobertura_temporal": "inicio_cobertura_temporal",
            "proposito": "proposito",
            "observaciones_dataset": "observaciones_dataset",
            "url_normativa_o_marco_legal": "url_normativa_o_marco_legal",
            "nomenclatura_edicion": "nomenclatura_edicion",
            "url_terminos_uso": "url_terminos_uso",
            "url_aviso_privacidad": "url_aviso_privacidad",
        },
        fks=[
            FkResolver(
                csv_column="fuente",
                parent_model=Fuente,
                parent_key_field="nombre",
                target_field="fuente_id",
                required=False,
            ),
            FkResolver(
                csv_column="tipo_dataset",
                parent_model=TipoDataset,
                parent_key_field="nombre",
                target_field="tipo_dataset_id",
                required=False,
            ),
        ],
        natural_key=["nombre", "fuente_id"],
    ),
    "edicion_dataset": EntityImportConfig(
        create_schema=EdicionDatasetCreate,
        model=EdicionDataset,
        required_columns=["edicion"],
        column_to_field={
            "edicion": "edicion",
            "fecha_publicacion": "fecha_publicacion",
            "periodo_referencia_inicio": "periodo_referencia_inicio",
            "periodo_referencia_fin": "periodo_referencia_fin",
            "url_metodologia_edicion": "url_metodologia_edicion",
            "url_metadatos_edicion": "url_metadatos_edicion",
            "observaciones_edicion": "observaciones_edicion",
            "puntaje": "puntaje",
            "dictamen": "dictamen",
        },
        fks=[
            FkResolver(
                csv_column="dataset",
                parent_model=Dataset,
                parent_key_field="nombre",
                target_field="dataset_id",
                required=False,
            ),
            FkResolver(
                csv_column="tipo_periodo",
                parent_model=TipoPeriodo,
                parent_key_field="nombre",
                target_field="tipo_periodo_id",
                required=False,
            ),
        ],
        natural_key=["edicion", "dataset_id"],
    ),
    "distribucion": EntityImportConfig(
        create_schema=DistribucionCreate,
        model=Distribucion,
        required_columns=[],
        column_to_field={
            "distribucion": "distribucion",
            "url": "url",
            "requiere_control_de_acceso": "requiere_control_de_acceso",
            "es_url_persistente": "es_url_persistente",
            "observaciones_distribucion": "observaciones_distribucion",
        },
        fks=[
            FkResolver(
                csv_column="dataset",
                parent_model=Dataset,
                parent_key_field="nombre",
                target_field="dataset_id",
                required=False,
            ),
            FkResolver(
                csv_column="tipo_de_acceso",
                parent_model=TipoDeAcceso,
                parent_key_field="nombre",
                target_field="tipo_de_acceso_id",
                required=False,
            ),
        ],
        composite_fks=[
            # La edicion se repite entre datasets (unica por edicion + dataset),
            # asi que se resuelve por la combinacion, no por el nombre suelto.
            CompositeFkResolver(
                parent_model=EdicionDataset,
                parts=(
                    FkKeyPart(csv_column="edicion", value_path=("edicion",)),
                    FkKeyPart(csv_column="dataset", value_path=("dataset", "nombre")),
                ),
                target_field="edicion_dataset_id",
                load_relationships=("dataset",),
                required=False,
            ),
        ],
        natural_key=["distribucion", "dataset_id", "edicion_dataset_id"],
    ),
    "archivo": EntityImportConfig(
        create_schema=ArchivoCreate,
        model=Archivo,
        required_columns=["nombre_archivo"],
        column_to_field={
            "nombre_archivo": "nombre_archivo",
            "ruta_relativa_en_distribucion": "ruta_relativa_en_distribucion",
            "rol_archivo": "rol_archivo",
            "fecha_obtencion": "fecha_obtencion",
            "fecha_ingesta": "fecha_ingesta",
            "tamano_bytes": "tamano_bytes",
            "hash_sha256": "hash_sha256",
            "observaciones_archivo": "observaciones_archivo",
        },
        composite_fks=[
            CompositeFkResolver(
                parent_model=Distribucion,
                parts=(
                    FkKeyPart(csv_column="distribucion", value_path=("distribucion",)),
                    FkKeyPart(csv_column="dataset", value_path=("dataset", "nombre")),
                    FkKeyPart(csv_column="edicion", value_path=("edicion_dataset", "edicion")),
                ),
                target_field="distribucion_id",
                load_relationships=("dataset", "edicion_dataset"),
                required=False,
            ),
        ],
        natural_key=["nombre_archivo", "distribucion_id"],
    ),
    "base_de_datos": EntityImportConfig(
        create_schema=BaseDeDatosCreate,
        model=BaseDeDatos,
        required_columns=["db_nombre"],
        column_to_field={
            "db_nombre": "db_nombre",
        },
        fks=[
            FkResolver(
                csv_column="archivo",
                parent_model=Archivo,
                parent_key_field="nombre_archivo",
                target_field="archivo_id",
                required=False,
            ),
        ],
        natural_key=["db_nombre", "archivo_id"],
    ),
    "informacion_tablas": EntityImportConfig(
        create_schema=InformacionTablasCreate,
        model=InformacionTablas,
        required_columns=["nombre"],
        column_to_field={
            "nombre": "nombre",
            "descripcion": "descripcion",
        },
        fks=[
            FkResolver(
                csv_column="base_de_datos",
                parent_model=BaseDeDatos,
                parent_key_field="db_nombre",
                target_field="base_de_datos_id",
                required=False,
            ),
            FkResolver(
                csv_column="producto",
                parent_model=Producto,
                parent_key_field="nombre",
                target_field="producto_id",
                required=False,
            ),
        ],
        natural_key=["nombre", "base_de_datos_id", "producto_id"],
    ),
}
