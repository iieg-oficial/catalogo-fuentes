import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.informacion_tablas import InformacionTablas
from models.producto import Producto
from schemas.producto import ProductoCreate, ProductoUpdate


async def list_productos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10_000,
    proyecto_id: uuid.UUID | None = None,
) -> list[Producto]:
    q = select(Producto).options(selectinload(Producto.proyecto))
    if proyecto_id:
        q = q.where(Producto.proyecto_id == proyecto_id)
    q = q.order_by(Producto.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_producto(db: AsyncSession, producto_id: uuid.UUID) -> Producto | None:
    result = await db.execute(
        select(Producto)
        .options(selectinload(Producto.proyecto))
        .where(Producto.id == producto_id)
    )
    return result.scalar_one_or_none()


async def get_producto_detail(db: AsyncSession, producto_id: uuid.UUID) -> Producto | None:
    result = await db.execute(
        select(Producto)
        .options(
            selectinload(Producto.proyecto),
            selectinload(Producto.informacion_tablas).selectinload(InformacionTablas.base_de_datos),
        )
        .where(Producto.id == producto_id)
    )
    return result.scalar_one_or_none()


async def create_producto(db: AsyncSession, data: ProductoCreate) -> Producto:
    obj = Producto(**data.model_dump())
    db.add(obj)
    await db.flush()
    await db.commit()
    return await get_producto(db, obj.id)  # type: ignore[return-value]


async def update_producto(
    db: AsyncSession, producto_id: uuid.UUID, data: ProductoUpdate
) -> Producto | None:
    obj = await get_producto(db, producto_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_producto(db, producto_id)


async def delete_producto(db: AsyncSession, producto_id: uuid.UUID) -> bool:
    result = await db.execute(select(Producto).where(Producto.id == producto_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
