import uuid
from datetime import datetime

from pydantic import BaseModel

from schemas.refs import BaseDeDatosRef, ProductoRef


class InformacionTablasBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    meta: dict = {}
    base_de_datos_id: uuid.UUID | None = None
    producto_id: uuid.UUID | None = None


class InformacionTablasCreate(InformacionTablasBase):
    pass


class InformacionTablasUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    meta: dict | None = None
    base_de_datos_id: uuid.UUID | None = None
    producto_id: uuid.UUID | None = None


class InformacionTablasRead(InformacionTablasBase):
    id: uuid.UUID
    base_de_datos: BaseDeDatosRef | None = None
    producto: ProductoRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
