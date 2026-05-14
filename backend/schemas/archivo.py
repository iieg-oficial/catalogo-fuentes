import uuid
from datetime import datetime

from pydantic import BaseModel

from schemas.refs import DistribucionRef


class ArchivoBase(BaseModel):
    nombre_archivo: str
    ruta_relativa_en_distribucion: str | None = None
    rol_archivo: str | None = None
    fecha_ingesta_sistema: datetime | None = None
    tamano_bytes: int | None = None
    archivos_relacionados: dict = {}
    ruta_almacenamiento: str | None = None
    observaciones_archivo: str | None = None
    distribucion_id: uuid.UUID | None = None


class ArchivoCreate(ArchivoBase):
    pass


class ArchivoUpdate(BaseModel):
    nombre_archivo: str | None = None
    ruta_relativa_en_distribucion: str | None = None
    rol_archivo: str | None = None
    fecha_ingesta_sistema: datetime | None = None
    tamano_bytes: int | None = None
    archivos_relacionados: dict | None = None
    ruta_almacenamiento: str | None = None
    observaciones_archivo: str | None = None
    distribucion_id: uuid.UUID | None = None


class ArchivoRead(ArchivoBase):
    id: uuid.UUID
    distribucion: DistribucionRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
