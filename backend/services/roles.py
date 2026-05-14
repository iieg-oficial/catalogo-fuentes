import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.rol import Rol
from schemas.rol import RolCreate, RolUpdate


async def list_roles(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[Rol]:
    result = await db.execute(
        select(Rol).order_by(Rol.created_at.asc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_rol(db: AsyncSession, rol_id: uuid.UUID) -> Rol | None:
    result = await db.execute(select(Rol).where(Rol.id == rol_id))
    return result.scalar_one_or_none()


async def get_rol_detail(db: AsyncSession, rol_id: uuid.UUID) -> Rol | None:
    result = await db.execute(
        select(Rol).options(selectinload(Rol.permisos)).where(Rol.id == rol_id)
    )
    return result.scalar_one_or_none()


async def create_rol(db: AsyncSession, data: RolCreate) -> Rol:
    obj = Rol(nombre=data.nombre, descripcion=data.descripcion)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_rol(db: AsyncSession, rol_id: uuid.UUID, data: RolUpdate) -> Rol | None:
    obj = await get_rol(db, rol_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_rol(db: AsyncSession, rol_id: uuid.UUID) -> bool:
    obj = await get_rol(db, rol_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
