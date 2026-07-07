from dataclasses import dataclass, field
from typing import Any

from models.producto import Producto
from models.proyecto import Proyecto
from schemas.producto import ProductoCreate
from schemas.proyecto import ProyectoCreate


@dataclass(frozen=True)
class FkResolver:
    """Describe cómo resolver una columna CSV contra una entidad padre."""

    csv_column: str
    parent_model: Any
    parent_key_field: str
    target_field: str


@dataclass(frozen=True)
class EntityImportConfig:
    """Configuración declarativa de import CSV para una entidad."""

    create_schema: Any
    model: Any
    required_columns: list[str]
    column_to_field: dict[str, str]
    fks: list[FkResolver] = field(default_factory=list)
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
            )
        ],
        natural_key=["nombre", "proyecto_id"],
    ),
}
