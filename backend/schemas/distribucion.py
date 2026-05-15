import uuid
from datetime import datetime

from pydantic import BaseModel

from schemas.refs import EdicionDatasetRef


class DistribucionBase(BaseModel):
    descriptor: str | None = None
    url: str | None = None
    requiere_autenticacion: bool = False
    requiere_registro: bool = False
    es_url_persistente: bool = False
    estado_url_ultima_revision: str | None = None
    observaciones_distribucion: str | None = None
    edicion_dataset_id: uuid.UUID | None = None


class DistribucionCreate(DistribucionBase):
    pass


class DistribucionUpdate(BaseModel):
    descriptor: str | None = None
    url: str | None = None
    requiere_autenticacion: bool | None = None
    requiere_registro: bool | None = None
    es_url_persistente: bool | None = None
    estado_url_ultima_revision: str | None = None
    observaciones_distribucion: str | None = None
    edicion_dataset_id: uuid.UUID | None = None


class DistribucionRead(DistribucionBase):
    id: uuid.UUID
    edicion_dataset: EdicionDatasetRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
