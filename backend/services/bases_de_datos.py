import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.base_de_datos import BaseDeDatos
from schemas.base_de_datos import BaseDeDatosCreate, BaseDeDatosUpdate


async def list_bases_de_datos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10_000,
    dataset_id: uuid.UUID | None = None,
) -> list[BaseDeDatos]:
    q = select(BaseDeDatos).options(selectinload(BaseDeDatos.dataset))
    if dataset_id:
        q = q.where(BaseDeDatos.dataset_id == dataset_id)
    q = q.order_by(BaseDeDatos.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_base_de_datos(db: AsyncSession, bd_id: uuid.UUID) -> BaseDeDatos | None:
    result = await db.execute(
        select(BaseDeDatos)
        .options(selectinload(BaseDeDatos.dataset))
        .where(BaseDeDatos.id == bd_id)
    )
    return result.scalar_one_or_none()


async def get_base_de_datos_detail(db: AsyncSession, bd_id: uuid.UUID) -> BaseDeDatos | None:
    result = await db.execute(
        select(BaseDeDatos)
        .options(
            selectinload(BaseDeDatos.dataset),
            selectinload(BaseDeDatos.informacion_tablas),
        )
        .where(BaseDeDatos.id == bd_id)
    )
    return result.scalar_one_or_none()


async def create_base_de_datos(db: AsyncSession, data: BaseDeDatosCreate) -> BaseDeDatos:
    obj = BaseDeDatos(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.commit()
    return await get_base_de_datos(db, obj.id)  # type: ignore[return-value]


async def update_base_de_datos(
    db: AsyncSession, bd_id: uuid.UUID, data: BaseDeDatosUpdate
) -> BaseDeDatos | None:
    obj = await get_base_de_datos(db, bd_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_base_de_datos(db, bd_id)


async def delete_base_de_datos(db: AsyncSession, bd_id: uuid.UUID) -> bool:
    obj = await get_base_de_datos(db, bd_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
