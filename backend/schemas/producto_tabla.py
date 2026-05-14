import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ProductoTablaCreate(BaseModel):
    producto_id: uuid.UUID
    informacion_tablas_id: uuid.UUID
    fecha_vinculacion: date | None = None
    observaciones: str | None = None


class ProductoTablaRead(BaseModel):
    id: uuid.UUID
    producto_id: uuid.UUID
    informacion_tablas_id: uuid.UUID
    fecha_vinculacion: date | None = None
    observaciones: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
