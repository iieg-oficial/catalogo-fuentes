import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class EdicionDataset(Base):
    __tablename__ = "edicion_dataset"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edicion: Mapped[str] = mapped_column(String, nullable=False)
    fecha_publicacion: Mapped[date | None] = mapped_column(Date, index=True)
    periodo_referencia_inicio: Mapped[date | None] = mapped_column(Date)
    periodo_referencia_fin: Mapped[date | None] = mapped_column(Date)
    tipo_periodo_referencia: Mapped[str | None] = mapped_column(String)
    url_metodologia_edicion: Mapped[str | None] = mapped_column(Text)
    url_metadatos_edicion: Mapped[str | None] = mapped_column(Text)
    observaciones_edicion: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    dataset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dataset.id", ondelete="SET NULL"), nullable=True, index=True
    )

    dataset: Mapped["Dataset | None"] = relationship("Dataset", back_populates="ediciones")
    distribuciones: Mapped[list["Distribucion"]] = relationship("Distribucion", back_populates="edicion_dataset", passive_deletes=True)
