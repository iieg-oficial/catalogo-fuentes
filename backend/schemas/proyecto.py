import uuid

from pydantic import BaseModel


class ProyectoBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    meta: dict = {}


class ProyectoCreate(ProyectoBase):
    pass


class ProyectoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    meta: dict | None = None


class ProyectoRead(ProyectoBase):
    id: uuid.UUID

    model_config = {"from_attributes": True}
