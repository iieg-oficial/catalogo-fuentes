import uuid
from datetime import datetime

from pydantic import BaseModel


class FuenteBase(BaseModel):
    nombre: str
    nombre_corto: str | None = None
    sector: str | None = None
    ambito: str | None = None
    url: str | None = None
    descripcion: str | None = None
    es_fuente_oficial: bool = False
    es_publicador: bool = False
    jurisdiccion: str | None = None
    url_terminos_uso: str | None = None
    url_aviso_privacidad: str | None = None
    contacto_institucional: str | None = None


class FuenteCreate(FuenteBase):
    pass


class FuenteUpdate(BaseModel):
    nombre: str | None = None
    nombre_corto: str | None = None
    sector: str | None = None
    ambito: str | None = None
    url: str | None = None
    descripcion: str | None = None
    es_fuente_oficial: bool | None = None
    es_publicador: bool | None = None
    jurisdiccion: str | None = None
    url_terminos_uso: str | None = None
    url_aviso_privacidad: str | None = None
    contacto_institucional: str | None = None


class FuenteRead(FuenteBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
