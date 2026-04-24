import uuid
from datetime import date

from pydantic import BaseModel

from schemas.url import UrlRead


class ArchivoBase(BaseModel):
    url_id: uuid.UUID
    descripcion: str | None = None
    fecha_publicacion: date | None = None
    fecha_fuente: str | None = None
    meta: dict = {}


class ArchivoCreate(ArchivoBase):
    pass


class ArchivoUpdate(BaseModel):
    url_id: uuid.UUID | None = None
    descripcion: str | None = None
    fecha_publicacion: date | None = None
    fecha_fuente: str | None = None
    meta: dict | None = None


class ArchivoRead(ArchivoBase):
    id: uuid.UUID
    url_id: uuid.UUID | None = None
    url_ref: UrlRead | None = None

    model_config = {"from_attributes": True}


class ArchivoDetail(ArchivoRead):
    pass
