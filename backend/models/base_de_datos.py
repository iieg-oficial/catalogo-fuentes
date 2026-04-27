import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class BaseDeDatos(Base):
    __tablename__ = "base_de_datos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    tema: Mapped[str | None] = mapped_column(String)
    frecuencia_actualizacion: Mapped[str | None] = mapped_column(String)
    meta: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped["User | None"] = relationship("User", foreign_keys=[updated_by_id])

    tablas: Mapped[list["Tabla"]] = relationship(
        "Tabla", back_populates="base_de_datos", passive_deletes=True
    )
    instrumentos: Mapped[list["Instrumento"]] = relationship(
        "Instrumento", back_populates="base_de_datos", passive_deletes=True
    )

    @property
    def updated_by_email(self) -> str | None:
        return self.updated_by.email if self.updated_by else None
