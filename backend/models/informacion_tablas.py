import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class InformacionTablas(Base):
    __tablename__ = "informacion_tablas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text)
    meta: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    base_de_datos_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("base_de_datos.id", ondelete="SET NULL"), nullable=True, index=True
    )

    base_de_datos: Mapped["BaseDeDatos | None"] = relationship("BaseDeDatos", back_populates="informacion_tablas")
    producto_tablas: Mapped[list["ProductoTabla"]] = relationship("ProductoTabla", back_populates="informacion_tabla", passive_deletes=True)
