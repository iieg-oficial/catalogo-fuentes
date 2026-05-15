import uuid
from datetime import datetime

from pydantic import BaseModel

from schemas.refs import DatasetRef


class BaseDeDatosBase(BaseModel):
    db_nombre: str
    descripcion_esquema: dict = {}
    meta: dict = {}
    dataset_id: uuid.UUID | None = None


class BaseDeDatosCreate(BaseDeDatosBase):
    pass


class BaseDeDatosUpdate(BaseModel):
    db_nombre: str | None = None
    descripcion_esquema: dict | None = None
    meta: dict | None = None
    dataset_id: uuid.UUID | None = None


class BaseDeDatosRead(BaseDeDatosBase):
    id: uuid.UUID
    dataset: DatasetRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
