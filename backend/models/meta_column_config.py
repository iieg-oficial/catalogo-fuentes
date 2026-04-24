from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class MetaColumnConfig(Base):
    __tablename__ = "meta_column_config"

    entity_type: Mapped[str] = mapped_column(String, primary_key=True)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
