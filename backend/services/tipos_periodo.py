import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.tipo_periodo import TipoPeriodo
from schemas.tipo_periodo import TipoPeriodoCreate, TipoPeriodoUpdate


async def list_tipos_periodo(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[TipoPeriodo]:
    result = await db.execute(
        select(TipoPeriodo).order_by(TipoPeriodo.created_at.asc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_tipo_periodo(db: AsyncSession, tipo_id: uuid.UUID) -> TipoPeriodo | None:
    result = await db.execute(select(TipoPeriodo).where(TipoPeriodo.id == tipo_id))
    return result.scalar_one_or_none()


async def create_tipo_periodo(db: AsyncSession, data: TipoPeriodoCreate) -> TipoPeriodo:
    obj = TipoPeriodo(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_tipo_periodo(
    db: AsyncSession, tipo_id: uuid.UUID, data: TipoPeriodoUpdate
) -> TipoPeriodo | None:
    obj = await get_tipo_periodo(db, tipo_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_tipo_periodo(db: AsyncSession, tipo_id: uuid.UUID) -> bool:
    obj = await get_tipo_periodo(db, tipo_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
