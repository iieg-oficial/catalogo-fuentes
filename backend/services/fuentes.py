import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.dataset import Dataset
from models.fuente import Fuente
from schemas.fuente import FuenteCreate, FuenteUpdate


async def list_fuentes(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[Fuente]:
    result = await db.execute(
        select(Fuente).order_by(Fuente.created_at.asc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_fuente(db: AsyncSession, fuente_id: uuid.UUID) -> Fuente | None:
    result = await db.execute(select(Fuente).where(Fuente.id == fuente_id))
    return result.scalar_one_or_none()


async def get_fuente_detail(db: AsyncSession, fuente_id: uuid.UUID) -> Fuente | None:
    result = await db.execute(
        select(Fuente)
        .options(selectinload(Fuente.datasets).selectinload(Dataset.tipo_dataset))
        .where(Fuente.id == fuente_id)
    )
    return result.scalar_one_or_none()


async def create_fuente(db: AsyncSession, data: FuenteCreate) -> Fuente:
    obj = Fuente(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_fuente(db: AsyncSession, fuente_id: uuid.UUID, data: FuenteUpdate) -> Fuente | None:
    obj = await get_fuente(db, fuente_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_fuente(db: AsyncSession, fuente_id: uuid.UUID) -> bool:
    obj = await get_fuente(db, fuente_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
