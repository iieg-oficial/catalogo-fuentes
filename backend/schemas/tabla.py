import uuid

from pydantic import BaseModel

from schemas.base_de_datos import BaseDeDatosRead
from schemas.producto import ProductoWithProyecto


class TablaBase(BaseModel):
    base_de_datos_id: uuid.UUID
    nombre: str
    campos: list = []
    meta: dict = {}


class TablaCreate(TablaBase):
    producto_ids: list[uuid.UUID] = []


class TablaUpdate(BaseModel):
    base_de_datos_id: uuid.UUID | None = None
    nombre: str | None = None
    campos: list | None = None
    meta: dict | None = None
    producto_ids: list[uuid.UUID] | None = None


class TablaRead(TablaBase):
    id: uuid.UUID
    base_de_datos_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


class TablaDetail(TablaRead):
    base_de_datos: BaseDeDatosRead | None = None
    productos: list[ProductoWithProyecto]
