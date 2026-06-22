import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator

from consts.dictamen import DICTAMEN_VALUES
from schemas.refs import DatasetRef, TipoPeriodoRef


def _validate_dictamen(value: str | None) -> str | None:
    """Valida que el dictamen pertenezca al catálogo cerrado A1..C."""
    if value is not None and value not in DICTAMEN_VALUES:
        raise ValueError(f"dictamen inválido: {value}")
    return value


class EdicionDatasetBase(BaseModel):
    edicion: str
    fecha_publicacion: date | None = None
    periodo_referencia_inicio: date | None = None
    periodo_referencia_fin: date | None = None
    url_metodologia_edicion: str | None = None
    url_metadatos_edicion: str | None = None
    observaciones_edicion: str | None = None
    puntaje: float | None = Field(default=None, ge=0, le=100)
    dictamen: str | None = None
    dataset_id: uuid.UUID | None = None
    tipo_periodo_id: uuid.UUID | None = None

    _check_dictamen = field_validator("dictamen")(_validate_dictamen)


class EdicionDatasetCreate(EdicionDatasetBase):
    pass


class EdicionDatasetUpdate(BaseModel):
    edicion: str | None = None
    fecha_publicacion: date | None = None
    periodo_referencia_inicio: date | None = None
    periodo_referencia_fin: date | None = None
    url_metodologia_edicion: str | None = None
    url_metadatos_edicion: str | None = None
    observaciones_edicion: str | None = None
    puntaje: float | None = Field(default=None, ge=0, le=100)
    dictamen: str | None = None
    dataset_id: uuid.UUID | None = None
    tipo_periodo_id: uuid.UUID | None = None

    _check_dictamen = field_validator("dictamen")(_validate_dictamen)


class EdicionDatasetRead(EdicionDatasetBase):
    id: uuid.UUID
    dataset: DatasetRef | None = None
    tipo_periodo: TipoPeriodoRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
