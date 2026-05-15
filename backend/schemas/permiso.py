import uuid
from datetime import datetime

from pydantic import BaseModel


class PermisoBase(BaseModel):
    nombre: str
    descripcion: str | None = None


class PermisoCreate(PermisoBase):
    pass


class PermisoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class PermisoRead(PermisoBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
