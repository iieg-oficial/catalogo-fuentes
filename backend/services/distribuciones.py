import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.distribucion import Distribucion
from schemas.distribucion import DistribucionCreate, DistribucionUpdate


async def list_distribuciones(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10_000,
    edicion_dataset_id: uuid.UUID | None = None,
) -> list[Distribucion]:
    q = select(Distribucion).options(
        selectinload(Distribucion.edicion_dataset),
        selectinload(Distribucion.dataset),
        selectinload(Distribucion.tipo_de_acceso),
        selectinload(Distribucion.medio_distribucion),
    )
    if edicion_dataset_id:
        q = q.where(Distribucion.edicion_dataset_id == edicion_dataset_id)
    q = q.order_by(Distribucion.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_distribucion(db: AsyncSession, distribucion_id: uuid.UUID) -> Distribucion | None:
    result = await db.execute(
        select(Distribucion)
        .options(
            selectinload(Distribucion.edicion_dataset),
            selectinload(Distribucion.dataset),
            selectinload(Distribucion.tipo_de_acceso),
            selectinload(Distribucion.medio_distribucion),
        )
        .where(Distribucion.id == distribucion_id)
    )
    return result.scalar_one_or_none()


async def get_distribucion_detail(db: AsyncSession, distribucion_id: uuid.UUID) -> Distribucion | None:
    result = await db.execute(
        select(Distribucion)
        .options(
            selectinload(Distribucion.edicion_dataset),
            selectinload(Distribucion.dataset),
            selectinload(Distribucion.tipo_de_acceso),
            selectinload(Distribucion.medio_distribucion),
            selectinload(Distribucion.archivos),
        )
        .where(Distribucion.id == distribucion_id)
    )
    return result.scalar_one_or_none()


async def create_distribucion(db: AsyncSession, data: DistribucionCreate) -> Distribucion:
    obj = Distribucion(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.commit()
    return await get_distribucion(db, obj.id)  # type: ignore[return-value]


async def update_distribucion(
    db: AsyncSession, distribucion_id: uuid.UUID, data: DistribucionUpdate
) -> Distribucion | None:
    obj = await get_distribucion(db, distribucion_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_distribucion(db, distribucion_id)


async def delete_distribucion(db: AsyncSession, distribucion_id: uuid.UUID) -> bool:
    obj = await get_distribucion(db, distribucion_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
