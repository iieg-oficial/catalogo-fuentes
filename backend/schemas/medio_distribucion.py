import uuid
from datetime import datetime

from pydantic import BaseModel


class MedioDistribucionBase(BaseModel):
    nombre: str
    descripcion: str | None = None


class MedioDistribucionCreate(MedioDistribucionBase):
    pass


class MedioDistribucionUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class MedioDistribucionRead(MedioDistribucionBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
