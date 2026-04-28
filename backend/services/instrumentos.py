import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.base_de_datos import BaseDeDatos
from models.instrumento import Instrumento
from schemas.instrumento import InstrumentoCreate, InstrumentoUpdate


async def list_instrumentos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    base_de_datos_id: uuid.UUID | None = None,
) -> list[Instrumento]:
    q = select(Instrumento).options(
        selectinload(Instrumento.base_de_datos).selectinload(BaseDeDatos.updated_by),
        selectinload(Instrumento.updated_by),
    )
    if base_de_datos_id:
        q = q.where(Instrumento.base_de_datos_id == base_de_datos_id)
    q = q.order_by(Instrumento.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_instrumento_detail(db: AsyncSession, instrumento_id: uuid.UUID) -> Instrumento | None:
    from models.url import Url  # noqa: F401

    result = await db.execute(
        select(Instrumento)
        .options(
            selectinload(Instrumento.base_de_datos).selectinload(BaseDeDatos.updated_by),
            selectinload(Instrumento.urls),
            selectinload(Instrumento.updated_by),
        )
        .where(Instrumento.id == instrumento_id)
    )
    return result.scalar_one_or_none()


async def _reload_instrumento(db: AsyncSession, instrumento_id: uuid.UUID) -> Instrumento:
    result = await db.execute(
        select(Instrumento)
        .options(
            selectinload(Instrumento.base_de_datos).selectinload(BaseDeDatos.updated_by),
            selectinload(Instrumento.updated_by),
        )
        .where(Instrumento.id == instrumento_id)
    )
    return result.scalar_one()


async def create_instrumento(db: AsyncSession, data: InstrumentoCreate) -> Instrumento:
    obj = Instrumento(
        base_de_datos_id=data.base_de_datos_id,
        nombre=data.nombre,
        descripcion=data.descripcion,
        fecha_publicacion=data.fecha_publicacion,
        meta=data.meta,
    )
    db.add(obj)
    await db.flush()
    await db.commit()
    return await _reload_instrumento(db, obj.id)


async def update_instrumento(
    db: AsyncSession, instrumento_id: uuid.UUID, data: InstrumentoUpdate, user_id: uuid.UUID
) -> Instrumento | None:
    result = await db.execute(select(Instrumento).where(Instrumento.id == instrumento_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    obj.updated_by_id = user_id
    await db.commit()
    return await _reload_instrumento(db, instrumento_id)


async def delete_instrumento(db: AsyncSession, instrumento_id: uuid.UUID) -> bool:
    result = await db.execute(select(Instrumento).where(Instrumento.id == instrumento_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
