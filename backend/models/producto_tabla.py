import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class ProductoTabla(Base):
    __tablename__ = "producto_tabla"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fecha_vinculacion: Mapped[date | None] = mapped_column(Date)
    observaciones: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    producto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("producto.id", ondelete="CASCADE"), nullable=False, index=True
    )
    informacion_tablas_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("informacion_tablas.id", ondelete="CASCADE"), nullable=False, index=True
    )

    producto: Mapped["Producto"] = relationship("Producto", back_populates="producto_tablas")
    informacion_tabla: Mapped["InformacionTablas"] = relationship("InformacionTablas", back_populates="producto_tablas")
