import uuid
from datetime import date, datetime

from pydantic import BaseModel

from schemas.refs import DatasetRef


class EdicionDatasetBase(BaseModel):
    nombre: str
    fecha_publicacion: date | None = None
    periodo_referencia_inicio: date | None = None
    periodo_referencia_fin: date | None = None
    tipo_periodo_referencia: str | None = None
    fecha_levantamiento_inicio: date | None = None
    fecha_levantamiento_fin: date | None = None
    url_documentacion_edicion: str | None = None
    url_comunicado_publicacion: str | None = None
    observaciones_edicion: str | None = None
    version_publicacion: str | None = None
    es_version_corregida: bool = False
    dataset_id: uuid.UUID | None = None


class EdicionDatasetCreate(EdicionDatasetBase):
    pass


class EdicionDatasetUpdate(BaseModel):
    nombre: str | None = None
    fecha_publicacion: date | None = None
    periodo_referencia_inicio: date | None = None
    periodo_referencia_fin: date | None = None
    tipo_periodo_referencia: str | None = None
    fecha_levantamiento_inicio: date | None = None
    fecha_levantamiento_fin: date | None = None
    url_documentacion_edicion: str | None = None
    url_comunicado_publicacion: str | None = None
    observaciones_edicion: str | None = None
    version_publicacion: str | None = None
    es_version_corregida: bool | None = None
    dataset_id: uuid.UUID | None = None


class EdicionDatasetRead(EdicionDatasetBase):
    id: uuid.UUID
    dataset: DatasetRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
