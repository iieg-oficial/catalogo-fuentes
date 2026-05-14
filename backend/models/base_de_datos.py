import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class BaseDeDatos(Base):
    __tablename__ = "base_de_datos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    db_nombre: Mapped[str] = mapped_column(String, nullable=False)
    descripcion_esquema: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    meta: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    dataset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dataset.id", ondelete="SET NULL"), nullable=True
    )

    dataset: Mapped["Dataset | None"] = relationship("Dataset", back_populates="bases_de_datos")
    informacion_tablas: Mapped[list["InformacionTablas"]] = relationship(
        "InformacionTablas", back_populates="base_de_datos", passive_deletes=True
    )
