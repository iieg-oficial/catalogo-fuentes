from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID

from db import Base

tabla_producto = Table(
    "tabla_producto",
    Base.metadata,
    Column("tabla_id", UUID(as_uuid=True), ForeignKey("tabla.id", ondelete="CASCADE"), primary_key=True),
    Column("producto_id", UUID(as_uuid=True), ForeignKey("producto.id", ondelete="CASCADE"), primary_key=True),
)
