import uuid
from datetime import datetime

from pydantic import BaseModel


class TipoDeAccesoBase(BaseModel):
    nombre: str
    descripcion: str | None = None


class TipoDeAccesoCreate(TipoDeAccesoBase):
    pass


class TipoDeAccesoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class TipoDeAccesoRead(TipoDeAccesoBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
