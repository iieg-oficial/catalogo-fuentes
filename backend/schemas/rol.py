import uuid
from datetime import datetime

from pydantic import BaseModel

from schemas.permiso import PermisoRead


class RolBase(BaseModel):
    nombre: str
    descripcion: str | None = None


class RolCreate(RolBase):
    pass


class RolUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class RolRead(RolBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class RolDetail(RolRead):
    permisos: list[PermisoRead] = []
