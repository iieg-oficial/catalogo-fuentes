import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.archivo import Archivo
from schemas.archivo import ArchivoCreate, ArchivoUpdate


async def list_archivos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10_000,
    distribucion_id: uuid.UUID | None = None,
) -> list[Archivo]:
    q = select(Archivo).options(selectinload(Archivo.distribucion))
    if distribucion_id:
        q = q.where(Archivo.distribucion_id == distribucion_id)
    q = q.order_by(Archivo.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_archivo(db: AsyncSession, archivo_id: uuid.UUID) -> Archivo | None:
    result = await db.execute(
        select(Archivo)
        .options(selectinload(Archivo.distribucion))
        .where(Archivo.id == archivo_id)
    )
    return result.scalar_one_or_none()


async def create_archivo(db: AsyncSession, data: ArchivoCreate) -> Archivo:
    obj = Archivo(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.commit()
    return await get_archivo(db, obj.id)  # type: ignore[return-value]


async def update_archivo(
    db: AsyncSession, archivo_id: uuid.UUID, data: ArchivoUpdate
) -> Archivo | None:
    result = await db.execute(select(Archivo).where(Archivo.id == archivo_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_archivo(db, archivo_id)


async def delete_archivo(db: AsyncSession, archivo_id: uuid.UUID) -> bool:
    result = await db.execute(select(Archivo).where(Archivo.id == archivo_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
