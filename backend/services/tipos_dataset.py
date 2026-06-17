import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.tipo_dataset import TipoDataset
from schemas.tipo_dataset import TipoDatasetCreate, TipoDatasetUpdate


async def list_tipos_dataset(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[TipoDataset]:
    result = await db.execute(
        select(TipoDataset).order_by(TipoDataset.created_at.asc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_tipo_dataset(db: AsyncSession, tipo_id: uuid.UUID) -> TipoDataset | None:
    result = await db.execute(select(TipoDataset).where(TipoDataset.id == tipo_id))
    return result.scalar_one_or_none()


async def create_tipo_dataset(db: AsyncSession, data: TipoDatasetCreate) -> TipoDataset:
    obj = TipoDataset(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_tipo_dataset(
    db: AsyncSession, tipo_id: uuid.UUID, data: TipoDatasetUpdate
) -> TipoDataset | None:
    obj = await get_tipo_dataset(db, tipo_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_tipo_dataset(db: AsyncSession, tipo_id: uuid.UUID) -> bool:
    obj = await get_tipo_dataset(db, tipo_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
