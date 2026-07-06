import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Distribucion(Base):
    __tablename__ = "distribucion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    distribucion: Mapped[str | None] = mapped_column(String)
    url: Mapped[str | None] = mapped_column(Text)
    requiere_control_de_acceso: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    es_url_persistente: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    observaciones_distribucion: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    edicion_dataset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("edicion_dataset.id", ondelete="SET NULL"), nullable=True, index=True
    )
    dataset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dataset.id", ondelete="SET NULL"), nullable=True, index=True
    )
    tipo_de_acceso_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tipo_de_acceso.id", ondelete="SET NULL"), nullable=True, index=True
    )

    edicion_dataset: Mapped["EdicionDataset | None"] = relationship("EdicionDataset", back_populates="distribuciones")
    dataset: Mapped["Dataset | None"] = relationship("Dataset", back_populates="distribuciones")
    tipo_de_acceso: Mapped["TipoDeAcceso | None"] = relationship("TipoDeAcceso", back_populates="distribuciones")
    archivos: Mapped[list["Archivo"]] = relationship("Archivo", back_populates="distribucion", passive_deletes=True)
