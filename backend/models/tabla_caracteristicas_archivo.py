import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class TablaCaracteristicasArchivo(Base):
    """Temáticas y características particulares de un archivo.

    Columnas de características pendientes de definir; por ahora solo
    establece el vínculo con archivo.
    """

    __tablename__ = "tabla_caracteristicas_archivo"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    archivo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("archivo.id", ondelete="CASCADE"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    archivo: Mapped["Archivo"] = relationship("Archivo", back_populates="caracteristicas")
