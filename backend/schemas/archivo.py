import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

from consts.rol_archivo import ROL_ARCHIVO_VALUES
from schemas.refs import DistribucionRef


def _validate_rol_archivo(value: str | None) -> str | None:
    """Valida que el rol_archivo pertenezca al catálogo cerrado."""
    if value is not None and value not in ROL_ARCHIVO_VALUES:
        raise ValueError(f"rol_archivo inválido: {value}")
    return value


class ArchivoBase(BaseModel):
    nombre_archivo: str
    ruta_relativa_en_distribucion: str | None = None
    rol_archivo: str | None = None
    fecha_obtencion: datetime | None = None
    fecha_ingesta: datetime | None = None
    tamano_bytes: int | None = None
    hash_sha256: str | None = None
    observaciones_archivo: str | None = None
    distribucion_id: uuid.UUID | None = None

    _check_rol_archivo = field_validator("rol_archivo")(_validate_rol_archivo)


class ArchivoCreate(ArchivoBase):
    pass


class ArchivoUpdate(BaseModel):
    nombre_archivo: str | None = None
    ruta_relativa_en_distribucion: str | None = None
    rol_archivo: str | None = None
    fecha_obtencion: datetime | None = None
    fecha_ingesta: datetime | None = None
    tamano_bytes: int | None = None
    hash_sha256: str | None = None
    observaciones_archivo: str | None = None
    distribucion_id: uuid.UUID | None = None

    _check_rol_archivo = field_validator("rol_archivo")(_validate_rol_archivo)


class ArchivoRead(ArchivoBase):
    id: uuid.UUID
    distribucion: DistribucionRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
