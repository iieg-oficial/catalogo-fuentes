import uuid
from datetime import datetime

from pydantic import BaseModel, computed_field

from schemas.refs import DatasetRef, EdicionDatasetRef, TipoDeAccesoRef


class DistribucionBase(BaseModel):
    distribucion: str | None = None
    url: str | None = None
    requiere_control_de_acceso: bool = False
    es_url_persistente: bool = False
    observaciones_distribucion: str | None = None
    edicion_dataset_id: uuid.UUID | None = None
    dataset_id: uuid.UUID | None = None
    tipo_de_acceso_id: uuid.UUID | None = None


class DistribucionCreate(DistribucionBase):
    pass


class DistribucionUpdate(BaseModel):
    distribucion: str | None = None
    url: str | None = None
    requiere_control_de_acceso: bool | None = None
    es_url_persistente: bool | None = None
    observaciones_distribucion: str | None = None
    edicion_dataset_id: uuid.UUID | None = None
    dataset_id: uuid.UUID | None = None
    tipo_de_acceso_id: uuid.UUID | None = None


class DistribucionRead(DistribucionBase):
    id: uuid.UUID
    edicion_dataset: EdicionDatasetRef | None = None
    dataset: DatasetRef | None = None
    tipo_de_acceso: TipoDeAccesoRef | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}

    @computed_field  # type: ignore[prop-decorator]
    @property
    def distribucion_label(self) -> str:
        """Etiqueta legible que distingue distribuciones con el mismo nombre.

        Combina distribucion, edicion y nombre_corto del dataset. Si no hay
        ninguna parte disponible, cae a los primeros 8 caracteres del id.
        """
        edicion = self.edicion_dataset.edicion if self.edicion_dataset else None
        nombre_corto = self.dataset.nombre_corto if self.dataset else None
        partes = [parte for parte in (self.distribucion, edicion, nombre_corto) if parte]
        return " · ".join(partes) if partes else str(self.id)[:8]
