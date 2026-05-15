import uuid

from pydantic import BaseModel


class FuenteRef(BaseModel):
    """Lightweight reference for nesting inside other Read schemas."""

    id: uuid.UUID
    nombre: str

    model_config = {"from_attributes": True}


class DatasetRef(BaseModel):
    """Lightweight reference for nesting inside other Read schemas."""

    id: uuid.UUID
    nombre: str

    model_config = {"from_attributes": True}


class EdicionDatasetRef(BaseModel):
    """Lightweight reference for nesting inside other Read schemas."""

    id: uuid.UUID
    nombre: str

    model_config = {"from_attributes": True}


class DistribucionRef(BaseModel):
    """Lightweight reference for nesting inside other Read schemas."""

    id: uuid.UUID
    descriptor: str | None = None

    model_config = {"from_attributes": True}


class BaseDeDatosRef(BaseModel):
    """Lightweight reference for nesting inside other Read schemas."""

    id: uuid.UUID
    db_nombre: str

    model_config = {"from_attributes": True}
