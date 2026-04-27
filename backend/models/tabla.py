import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Tabla(Base):
    __tablename__ = "tabla"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    base_de_datos_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("base_de_datos.id", ondelete="SET NULL"), nullable=True
    )
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    campos: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    meta: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped["User | None"] = relationship("User", foreign_keys=[updated_by_id])

    base_de_datos: Mapped["BaseDeDatos | None"] = relationship("BaseDeDatos", back_populates="tablas")
    productos: Mapped[list["Producto"]] = relationship(
        "Producto", secondary="tabla_producto", back_populates="tablas"
    )

    @property
    def updated_by_email(self) -> str | None:
        return self.updated_by.email if self.updated_by else None
