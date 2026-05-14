import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Archivo(Base):
    __tablename__ = "archivo"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_archivo: Mapped[str] = mapped_column(String, nullable=False)
    ruta_relativa_en_distribucion: Mapped[str | None] = mapped_column(String)
    rol_archivo: Mapped[str | None] = mapped_column(String)
    fecha_ingesta_sistema: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tamano_bytes: Mapped[int | None] = mapped_column(BigInteger)
    hash_sha256: Mapped[str | None] = mapped_column(String)
    archivos_relacionados: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    ruta_almacenamiento: Mapped[str | None] = mapped_column(Text)
    observaciones_archivo: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    distribucion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distribucion.id", ondelete="SET NULL"), nullable=True
    )

    distribucion: Mapped["Distribucion | None"] = relationship("Distribucion", back_populates="archivos")
