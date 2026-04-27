import uuid
from datetime import datetime

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
    updated_at: datetime | None = None
    updated_by_email: str | None = None

    model_config = {"from_attributes": True}
