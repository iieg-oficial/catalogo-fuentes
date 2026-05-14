import uuid
from datetime import date, datetime

from pydantic import BaseModel

from schemas.fuente import FuenteRead


class DatasetBase(BaseModel):
    nombre: str
    nombre_corto: str | None = None
    descripcion: str | None = None
    identificador_persistente: str | None = None
    periodicidad: str | None = None
    vigente: bool = True
    url_pagina_principal: str | None = None
    url_metodologia_general: str | None = None
    url_metadatos_general: str | None = None
    desagregacion_geografica: str | None = None
    cobertura_temporal_general: str | None = None
    unidad_observacion: str | None = None
    tema_principal: str | None = None
    proposito: str | None = None
    fecha_inicio_disponibilidad: date | None = None
    fecha_fin_disponibilidad: date | None = None
    observaciones_dataset: str | None = None
    etiquetas: dict | None = None
    url_normativa_o_marco_legal: str | None = None
    fuente_id: uuid.UUID | None = None


class DatasetCreate(DatasetBase):
    pass


class DatasetUpdate(BaseModel):
    nombre: str | None = None
    nombre_corto: str | None = None
    descripcion: str | None = None
    identificador_persistente: str | None = None
    periodicidad: str | None = None
    vigente: bool | None = None
    url_pagina_principal: str | None = None
    url_metodologia_general: str | None = None
    url_metadatos_general: str | None = None
    desagregacion_geografica: str | None = None
    cobertura_temporal_general: str | None = None
    unidad_observacion: str | None = None
    tema_principal: str | None = None
    proposito: str | None = None
    fecha_inicio_disponibilidad: date | None = None
    fecha_fin_disponibilidad: date | None = None
    observaciones_dataset: str | None = None
    etiquetas: dict | None = None
    url_normativa_o_marco_legal: str | None = None
    fuente_id: uuid.UUID | None = None


class DatasetRead(DatasetBase):
    id: uuid.UUID
    fuente: FuenteRead | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
