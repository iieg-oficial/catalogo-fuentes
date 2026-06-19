import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.dataset import Dataset
from models.distribucion import Distribucion
from schemas.dataset import DatasetCreate, DatasetUpdate


async def list_datasets(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10_000,
    fuente_id: uuid.UUID | None = None,
) -> list[Dataset]:
    q = select(Dataset).options(selectinload(Dataset.fuente), selectinload(Dataset.tipo_dataset))
    if fuente_id:
        q = q.where(Dataset.fuente_id == fuente_id)
    q = q.order_by(Dataset.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> Dataset | None:
    result = await db.execute(
        select(Dataset)
        .options(selectinload(Dataset.fuente), selectinload(Dataset.tipo_dataset))
        .where(Dataset.id == dataset_id)
    )
    return result.scalar_one_or_none()


async def get_dataset_detail(db: AsyncSession, dataset_id: uuid.UUID) -> Dataset | None:
    result = await db.execute(
        select(Dataset)
        .options(
            selectinload(Dataset.fuente),
            selectinload(Dataset.tipo_dataset),
            selectinload(Dataset.ediciones),
            selectinload(Dataset.distribuciones).selectinload(Distribucion.edicion_dataset),
            selectinload(Dataset.distribuciones).selectinload(Distribucion.tipo_de_acceso),
            selectinload(Dataset.distribuciones).selectinload(Distribucion.medio_distribucion),
        )
        .where(Dataset.id == dataset_id)
    )
    return result.scalar_one_or_none()


async def create_dataset(db: AsyncSession, data: DatasetCreate) -> Dataset:
    obj = Dataset(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.commit()
    return await get_dataset(db, obj.id)  # type: ignore[return-value]


async def update_dataset(db: AsyncSession, dataset_id: uuid.UUID, data: DatasetUpdate) -> Dataset | None:
    obj = await get_dataset(db, dataset_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_dataset(db, dataset_id)


async def delete_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> bool:
    obj = await get_dataset(db, dataset_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
