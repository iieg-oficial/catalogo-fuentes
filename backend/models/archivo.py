import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class Archivo(Base):
    __tablename__ = "archivo"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_archivo: Mapped[str] = mapped_column(String, nullable=False)
    ruta_relativa_en_distribucion: Mapped[str | None] = mapped_column(String)
    rol_archivo: Mapped[str | None] = mapped_column(String)
    fecha_obtencion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fecha_ingesta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tamano_bytes: Mapped[int | None] = mapped_column(BigInteger)
    hash_sha256: Mapped[str | None] = mapped_column(String(64))
    observaciones_archivo: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    distribucion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distribucion.id", ondelete="SET NULL"), nullable=True, index=True
    )

    distribucion: Mapped["Distribucion | None"] = relationship("Distribucion", back_populates="archivos")
    bases_de_datos: Mapped[list["BaseDeDatos"]] = relationship("BaseDeDatos", back_populates="archivo", passive_deletes=True)
    caracteristicas: Mapped[list["TablaCaracteristicasArchivo"]] = relationship(
        "TablaCaracteristicasArchivo", back_populates="archivo", passive_deletes=True
    )
