import uuid

from sqlalchemy import String, Text
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

    tablas: Mapped[list["Tabla"]] = relationship(
        "Tabla", back_populates="base_de_datos", passive_deletes=True
    )
    instrumentos: Mapped[list["Instrumento"]] = relationship(
        "Instrumento", back_populates="base_de_datos", passive_deletes=True
    )
