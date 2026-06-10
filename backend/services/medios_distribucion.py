import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.medio_distribucion import MedioDistribucion
from schemas.medio_distribucion import MedioDistribucionCreate, MedioDistribucionUpdate


async def list_medios_distribucion(
    db: AsyncSession, skip: int = 0, limit: int = 10_000
) -> list[MedioDistribucion]:
    result = await db.execute(
        select(MedioDistribucion).order_by(MedioDistribucion.created_at.asc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_medio_distribucion(db: AsyncSession, medio_id: uuid.UUID) -> MedioDistribucion | None:
    result = await db.execute(select(MedioDistribucion).where(MedioDistribucion.id == medio_id))
    return result.scalar_one_or_none()


async def create_medio_distribucion(db: AsyncSession, data: MedioDistribucionCreate) -> MedioDistribucion:
    obj = MedioDistribucion(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_medio_distribucion(
    db: AsyncSession, medio_id: uuid.UUID, data: MedioDistribucionUpdate
) -> MedioDistribucion | None:
    obj = await get_medio_distribucion(db, medio_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_medio_distribucion(db: AsyncSession, medio_id: uuid.UUID) -> bool:
    obj = await get_medio_distribucion(db, medio_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
