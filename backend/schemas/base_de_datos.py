import uuid
from datetime import datetime

from pydantic import BaseModel


class BaseDeDatosBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    tema: str | None = None
    frecuencia_actualizacion: str | None = None
    meta: dict = {}


class BaseDeDatosCreate(BaseDeDatosBase):
    pass


class BaseDeDatosUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    tema: str | None = None
    frecuencia_actualizacion: str | None = None
    meta: dict | None = None


class BaseDeDatosRead(BaseDeDatosBase):
    id: uuid.UUID
    updated_at: datetime | None = None
    updated_by_email: str | None = None

    model_config = {"from_attributes": True}
