import uuid
from datetime import datetime

from pydantic import BaseModel

from schemas.fuente import FuenteRead
from schemas.refs import TipoDatasetRef


class DatasetBase(BaseModel):
    nombre: str
    nombre_corto: str | None = None
    descripcion: str | None = None
    url_persistente: str | None = None
    periodicidad: str | None = None
    vigente: bool = True
    desagregacion_geografica: str | None = None
    inicio_cobertura_temporal: str | None = None
    proposito: str | None = None
    observaciones_dataset: str | None = None
    etiquetas: dict | None = None
    url_normativa_o_marco_legal: str | None = None
    nomenclatura_edicion: str | None = None
    url_terminos_uso: str | None = None
    url_aviso_privacidad: str | None = None
    fuente_id: uuid.UUID | None = None
    tipo_dataset_id: uuid.UUID | None = None


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    nombre: str | None = None
    nombre_corto: str | None = None
    descripcion: str | None = None
    url_persistente: str | None = None
    periodicidad: str | None = None
    vigente: bool | None = None
    desagregacion_geografica: str | None = None
    inicio_cobertura_temporal: str | None = None
    proposito: str | None = None
    observaciones_dataset: str | None = None
    etiquetas: dict | None = None
    url_normativa_o_marco_legal: str | None = None
    nomenclatura_edicion: str | None = None
    url_terminos_uso: str | None = None
    url_aviso_privacidad: str | None = None
    fuente_id: uuid.UUID | None = None
    tipo_dataset_id: uuid.UUID | None = None


class DatasetRead(DatasetBase):
    id: uuid.UUID
    fuente: FuenteRead | None = None
    tipo_dataset: TipoDatasetRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
