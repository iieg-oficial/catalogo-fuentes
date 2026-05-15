import uuid
from datetime import datetime

from pydantic import BaseModel


class ProyectoBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    meta: dict = {}
    usuario_id: uuid.UUID | None = None


class ProyectoCreate(ProyectoBase):
    pass


class ProyectoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    meta: dict | None = None
    usuario_id: uuid.UUID | None = None


class ProyectoRead(ProyectoBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
