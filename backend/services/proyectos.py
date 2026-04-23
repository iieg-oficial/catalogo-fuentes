import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.proyecto import Proyecto
from schemas.proyecto import ProyectoCreate, ProyectoUpdate


async def list_proyectos(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Proyecto]:
    result = await db.execute(select(Proyecto).offset(skip).limit(limit))
    return list(result.scalars().all())


async def get_proyecto(db: AsyncSession, proyecto_id: uuid.UUID) -> Proyecto | None:
    result = await db.execute(select(Proyecto).where(Proyecto.id == proyecto_id))
    return result.scalar_one_or_none()


async def get_proyecto_detail(db: AsyncSession, proyecto_id: uuid.UUID) -> Proyecto | None:
    result = await db.execute(
        select(Proyecto)
        .options(selectinload(Proyecto.productos))
        .where(Proyecto.id == proyecto_id)
    )
    return result.scalar_one_or_none()


async def create_proyecto(db: AsyncSession, data: ProyectoCreate) -> Proyecto:
    obj = Proyecto(nombre=data.nombre, descripcion=data.descripcion, meta=data.meta)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_proyecto(db: AsyncSession, proyecto_id: uuid.UUID, data: ProyectoUpdate) -> Proyecto | None:
    obj = await get_proyecto(db, proyecto_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_proyecto(db: AsyncSession, proyecto_id: uuid.UUID) -> bool:
    obj = await get_proyecto(db, proyecto_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
