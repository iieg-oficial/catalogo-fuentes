import uuid
from datetime import datetime

from pydantic import BaseModel


class TipoPeriodoBase(BaseModel):
    nombre: str
    descripcion: str | None = None


class TipoPeriodoCreate(TipoPeriodoBase):
    pass


class TipoPeriodoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class TipoPeriodoRead(TipoPeriodoBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
