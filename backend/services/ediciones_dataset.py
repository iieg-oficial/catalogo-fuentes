import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.distribucion import Distribucion
from models.edicion_dataset import EdicionDataset
from schemas.edicion_dataset import EdicionDatasetCreate, EdicionDatasetUpdate


async def list_ediciones_dataset(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10_000,
    dataset_id: uuid.UUID | None = None,
) -> list[EdicionDataset]:
    q = select(EdicionDataset).options(selectinload(EdicionDataset.dataset), selectinload(EdicionDataset.tipo_periodo))
    if dataset_id:
        q = q.where(EdicionDataset.dataset_id == dataset_id)
    q = q.order_by(EdicionDataset.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_edicion_dataset(db: AsyncSession, edicion_id: uuid.UUID) -> EdicionDataset | None:
    result = await db.execute(
        select(EdicionDataset)
        .options(selectinload(EdicionDataset.dataset), selectinload(EdicionDataset.tipo_periodo))
        .where(EdicionDataset.id == edicion_id)
    )
    return result.scalar_one_or_none()


async def get_edicion_dataset_detail(db: AsyncSession, edicion_id: uuid.UUID) -> EdicionDataset | None:
    result = await db.execute(
        select(EdicionDataset)
        .options(
            selectinload(EdicionDataset.dataset),
            selectinload(EdicionDataset.tipo_periodo),
            selectinload(EdicionDataset.distribuciones).selectinload(Distribucion.dataset),
            selectinload(EdicionDataset.distribuciones).selectinload(Distribucion.tipo_de_acceso),
            selectinload(EdicionDataset.distribuciones).selectinload(Distribucion.medio_distribucion),
        )
        .where(EdicionDataset.id == edicion_id)
    )
    return result.scalar_one_or_none()


async def create_edicion_dataset(db: AsyncSession, data: EdicionDatasetCreate) -> EdicionDataset:
    obj = EdicionDataset(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.commit()
    return await get_edicion_dataset(db, obj.id)  # type: ignore[return-value]


async def update_edicion_dataset(
    db: AsyncSession, edicion_id: uuid.UUID, data: EdicionDatasetUpdate
) -> EdicionDataset | None:
    obj = await get_edicion_dataset(db, edicion_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_edicion_dataset(db, edicion_id)


async def delete_edicion_dataset(db: AsyncSession, edicion_id: uuid.UUID) -> bool:
    obj = await get_edicion_dataset(db, edicion_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
