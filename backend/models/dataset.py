import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Dataset(Base):
    __tablename__ = "dataset"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False, index=True)
    nombre_corto: Mapped[str | None] = mapped_column(String)
    descripcion: Mapped[str | None] = mapped_column(Text)
    url_persistente: Mapped[str | None] = mapped_column(Text)
    periodicidad: Mapped[str | None] = mapped_column(String)
    vigente: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    desagregacion_geografica: Mapped[str | None] = mapped_column(String)
    inicio_cobertura_temporal: Mapped[str | None] = mapped_column(String)
    proposito: Mapped[str | None] = mapped_column(Text)
    observaciones_dataset: Mapped[str | None] = mapped_column(Text)
    etiquetas: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    url_normativa_o_marco_legal: Mapped[str | None] = mapped_column(Text)
    nomenclatura_edicion: Mapped[str | None] = mapped_column(String)
    url_terminos_uso: Mapped[str | None] = mapped_column(Text)
    url_aviso_privacidad: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    fuente_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("fuente.id", ondelete="SET NULL"), nullable=True, index=True
    )
    tipo_dataset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tipo_dataset.id", ondelete="SET NULL"), nullable=True, index=True
    )

    fuente: Mapped["Fuente | None"] = relationship("Fuente", back_populates="datasets")
    tipo_dataset: Mapped["TipoDataset | None"] = relationship("TipoDataset", back_populates="datasets")
    ediciones: Mapped[list["EdicionDataset"]] = relationship("EdicionDataset", back_populates="dataset", passive_deletes=True)
    distribuciones: Mapped[list["Distribucion"]] = relationship("Distribucion", back_populates="dataset", passive_deletes=True)
