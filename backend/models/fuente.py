import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Fuente(Base):
    __tablename__ = "fuente"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False, index=True)
    nombre_corto: Mapped[str | None] = mapped_column(String)
    sector: Mapped[str | None] = mapped_column(String)
    ambito: Mapped[str | None] = mapped_column(String)
    url: Mapped[str | None] = mapped_column(Text)
    descripcion: Mapped[str | None] = mapped_column(Text)
    es_fuente_oficial: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    es_publicador: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    contacto_institucional: Mapped[str | None] = mapped_column(String)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    datasets: Mapped[list["Dataset"]] = relationship("Dataset", back_populates="fuente", passive_deletes=True)
