import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.tipo_de_acceso import TipoDeAcceso
from schemas.tipo_de_acceso import TipoDeAccesoCreate, TipoDeAccesoUpdate


async def list_tipos_de_acceso(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[TipoDeAcceso]:
    result = await db.execute(
        select(TipoDeAcceso).order_by(TipoDeAcceso.created_at.asc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_tipo_de_acceso(db: AsyncSession, tipo_id: uuid.UUID) -> TipoDeAcceso | None:
    result = await db.execute(select(TipoDeAcceso).where(TipoDeAcceso.id == tipo_id))
    return result.scalar_one_or_none()


async def create_tipo_de_acceso(db: AsyncSession, data: TipoDeAccesoCreate) -> TipoDeAcceso:
    obj = TipoDeAcceso(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_tipo_de_acceso(
    db: AsyncSession, tipo_id: uuid.UUID, data: TipoDeAccesoUpdate
) -> TipoDeAcceso | None:
    obj = await get_tipo_de_acceso(db, tipo_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_tipo_de_acceso(db: AsyncSession, tipo_id: uuid.UUID) -> bool:
    obj = await get_tipo_de_acceso(db, tipo_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
