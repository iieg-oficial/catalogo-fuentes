import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.user import UserCreate, UserUpdate
from services.auth import get_user_by_email, hash_password


async def list_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[User]:
    result = await db.execute(select(User).offset(skip).limit(limit))
    return list(result.scalars().all())


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserCreate) -> User | None:
    existing = await get_user_by_email(db, data.email)
    if existing:
        return None
    obj = User(email=data.email, hashed_password=None, role=data.role, is_active=False)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_user(db: AsyncSession, user_id: uuid.UUID, data: UserUpdate) -> User | None:
    obj = await get_user(db, user_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> bool:
    obj = await get_user(db, user_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
