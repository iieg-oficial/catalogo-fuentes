import uuid
from datetime import datetime

from pydantic import BaseModel


class TipoDatasetBase(BaseModel):
    nombre: str
    descripcion: str | None = None


class TipoDatasetCreate(TipoDatasetBase):
    pass


class TipoDatasetUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None


class TipoDatasetRead(TipoDatasetBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
