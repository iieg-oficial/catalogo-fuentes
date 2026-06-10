import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Dataset(Base):
    __tablename__ = "dataset"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False, index=True)
    nombre_corto: Mapped[str | None] = mapped_column(String)
    descripcion: Mapped[str | None] = mapped_column(Text)
    identificador_persistente: Mapped[str | None] = mapped_column(String)
    periodicidad: Mapped[str | None] = mapped_column(String)
    vigente: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    url_pagina_principal: Mapped[str | None] = mapped_column(Text)
    url_metodologia_general: Mapped[str | None] = mapped_column(Text)
    url_metadatos_general: Mapped[str | None] = mapped_column(Text)
    desagregacion_geografica: Mapped[str | None] = mapped_column(String)
    cobertura_temporal_general: Mapped[str | None] = mapped_column(String)
    unidad_observacion: Mapped[str | None] = mapped_column(String)
    tema_principal: Mapped[str | None] = mapped_column(String)
    proposito: Mapped[str | None] = mapped_column(Text)
    fecha_inicio_disponibilidad: Mapped[date | None] = mapped_column(Date)
    fecha_fin_disponibilidad: Mapped[date | None] = mapped_column(Date)
    observaciones_dataset: Mapped[str | None] = mapped_column(Text)
    etiquetas: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    url_normativa_o_marco_legal: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    fuente_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fuente.id", ondelete="SET NULL"), nullable=True, index=True
    )

    fuente: Mapped["Fuente | None"] = relationship("Fuente", back_populates="datasets")
    ediciones: Mapped[list["EdicionDataset"]] = relationship("EdicionDataset", back_populates="dataset", passive_deletes=True)
    bases_de_datos: Mapped[list["BaseDeDatos"]] = relationship("BaseDeDatos", back_populates="dataset", passive_deletes=True)
