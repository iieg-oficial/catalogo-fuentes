import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.informacion_tablas import InformacionTablas
from schemas.informacion_tablas import InformacionTablasCreate, InformacionTablasUpdate


async def list_informacion_tablas(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10_000,
    base_de_datos_id: uuid.UUID | None = None,
) -> list[InformacionTablas]:
    q = select(InformacionTablas).options(
        selectinload(InformacionTablas.base_de_datos),
        selectinload(InformacionTablas.producto),
    )
    if base_de_datos_id:
        q = q.where(InformacionTablas.base_de_datos_id == base_de_datos_id)
    q = q.order_by(InformacionTablas.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_informacion_tabla(db: AsyncSession, tabla_id: uuid.UUID) -> InformacionTablas | None:
    result = await db.execute(
        select(InformacionTablas)
        .options(
            selectinload(InformacionTablas.base_de_datos),
            selectinload(InformacionTablas.producto),
        )
        .where(InformacionTablas.id == tabla_id)
    )
    return result.scalar_one_or_none()


async def create_informacion_tabla(db: AsyncSession, data: InformacionTablasCreate) -> InformacionTablas:
    obj = InformacionTablas(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.commit()
    return await get_informacion_tabla(db, obj.id)  # type: ignore[return-value]


async def update_informacion_tabla(
    db: AsyncSession, tabla_id: uuid.UUID, data: InformacionTablasUpdate
) -> InformacionTablas | None:
    obj = await get_informacion_tabla(db, tabla_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_informacion_tabla(db, tabla_id)


async def delete_informacion_tabla(db: AsyncSession, tabla_id: uuid.UUID) -> bool:
    obj = await get_informacion_tabla(db, tabla_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
