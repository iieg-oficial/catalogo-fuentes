import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Archivo(Base):
    __tablename__ = "archivo"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("url.id", ondelete="SET NULL"), nullable=True
    )
    descripcion: Mapped[str | None] = mapped_column(Text)
    fecha_publicacion: Mapped[date | None] = mapped_column(Date)
    fecha_fuente: Mapped[str | None] = mapped_column(String)
    meta: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict, server_default="{}")

    url_ref: Mapped["Url | None"] = relationship("Url", back_populates="archivos")
