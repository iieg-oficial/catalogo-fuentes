import uuid
from datetime import datetime

from pydantic import BaseModel

from schemas.proyecto import ProyectoRead


class ProductoBase(BaseModel):
    proyecto_id: uuid.UUID
    nombre: str
    descripcion: str | None = None
    meta: dict = {}


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    proyecto_id: uuid.UUID | None = None
    nombre: str | None = None
    descripcion: str | None = None
    meta: dict | None = None


class ProductoRead(ProductoBase):
    id: uuid.UUID
    proyecto_id: uuid.UUID | None = None
    updated_at: datetime | None = None
    updated_by_email: str | None = None

    model_config = {"from_attributes": True}


class ProductoWithProyecto(ProductoRead):
    proyecto: ProyectoRead | None = None
