import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Producto(Base):
    __tablename__ = "producto"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proyecto_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("proyecto.id", ondelete="SET NULL"), nullable=True
    )
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    meta: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict, server_default="{}")

    proyecto: Mapped["Proyecto | None"] = relationship("Proyecto", back_populates="productos")
    tablas: Mapped[list["Tabla"]] = relationship(
        "Tabla", secondary="tabla_producto", back_populates="productos"
    )
