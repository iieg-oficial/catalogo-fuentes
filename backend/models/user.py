import enum
import uuid

from sqlalchemy import Boolean, Enum as SAEnum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    maintainer = "maintainer"
    viewer = "viewer"        # kept for backward compatibility
    visualizer = "visualizer"
    superadmin = "superadmin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"), nullable=False, default=UserRole.visualizer
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
