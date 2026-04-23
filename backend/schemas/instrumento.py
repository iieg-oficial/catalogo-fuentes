import uuid
from datetime import date

from pydantic import BaseModel

from schemas.base_de_datos import BaseDeDatosRead
from schemas.tabla import TablaRead


class InstrumentoBase(BaseModel):
    base_de_datos_id: uuid.UUID
    nombre: str
    descripcion: str | None = None
    fecha_publicacion: date | None = None
    meta: dict = {}


class InstrumentoCreate(InstrumentoBase):
    pass


class InstrumentoUpdate(BaseModel):
    base_de_datos_id: uuid.UUID | None = None
    nombre: str | None = None
    descripcion: str | None = None
    fecha_publicacion: date | None = None
    meta: dict | None = None


class InstrumentoRead(InstrumentoBase):
    id: uuid.UUID
    base_de_datos: BaseDeDatosRead | None = None

    model_config = {"from_attributes": True}


class InstrumentoDetail(InstrumentoRead):
    tablas: list[TablaRead]
