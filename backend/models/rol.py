import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Rol(Base):
    __tablename__ = "rol"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    permisos: Mapped[list["Permiso"]] = relationship(
        "Permiso", secondary="permiso_rol", back_populates="roles"
    )
    usuarios: Mapped[list["Usuario"]] = relationship(
        "Usuario", back_populates="rol"
    )
