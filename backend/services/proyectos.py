import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.proyecto import Proyecto
from schemas.proyecto import ProyectoCreate, ProyectoUpdate


async def list_proyectos(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[Proyecto]:
    result = await db.execute(
        select(Proyecto)
        .options(selectinload(Proyecto.updated_by))
        .order_by(Proyecto.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_proyecto(db: AsyncSession, proyecto_id: uuid.UUID) -> Proyecto | None:
    result = await db.execute(
        select(Proyecto)
        .options(selectinload(Proyecto.updated_by))
        .where(Proyecto.id == proyecto_id)
    )
    return result.scalar_one_or_none()


async def get_proyecto_detail(db: AsyncSession, proyecto_id: uuid.UUID) -> Proyecto | None:
    result = await db.execute(
        select(Proyecto)
        .options(
            selectinload(Proyecto.productos),
            selectinload(Proyecto.updated_by),
        )
        .where(Proyecto.id == proyecto_id)
    )
    return result.scalar_one_or_none()


async def create_proyecto(db: AsyncSession, data: ProyectoCreate) -> Proyecto:
    obj = Proyecto(nombre=data.nombre, descripcion=data.descripcion, meta=data.meta)
    db.add(obj)
    await db.flush()
    await db.commit()
    result = await get_proyecto(db, obj.id)
    return result  # type: ignore[return-value]


async def update_proyecto(
    db: AsyncSession, proyecto_id: uuid.UUID, data: ProyectoUpdate, user_id: uuid.UUID
) -> Proyecto | None:
    obj = await get_proyecto(db, proyecto_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    obj.updated_by_id = user_id
    await db.commit()
    return await get_proyecto(db, proyecto_id)


async def delete_proyecto(db: AsyncSession, proyecto_id: uuid.UUID) -> bool:
    obj = await get_proyecto(db, proyecto_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
