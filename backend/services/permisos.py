import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.permiso import Permiso
from schemas.permiso import PermisoCreate, PermisoUpdate


async def list_permisos(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[Permiso]:
    result = await db.execute(
        select(Permiso).order_by(Permiso.created_at.asc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_permiso(db: AsyncSession, permiso_id: uuid.UUID) -> Permiso | None:
    result = await db.execute(select(Permiso).where(Permiso.id == permiso_id))
    return result.scalar_one_or_none()


async def create_permiso(db: AsyncSession, data: PermisoCreate) -> Permiso:
    obj = Permiso(nombre=data.nombre, descripcion=data.descripcion)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_permiso(db: AsyncSession, permiso_id: uuid.UUID, data: PermisoUpdate) -> Permiso | None:
    obj = await get_permiso(db, permiso_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_permiso(db: AsyncSession, permiso_id: uuid.UUID) -> bool:
    obj = await get_permiso(db, permiso_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
