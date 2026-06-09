import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.producto_tabla import ProductoTabla
from schemas.producto_tabla import ProductoTablaCreate, ProductoTablaUpdate


async def list_producto_tablas(
    db: AsyncSession,
    producto_id: uuid.UUID | None = None,
    informacion_tablas_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 10_000,
) -> list[ProductoTabla]:
    q = select(ProductoTabla)
    if producto_id:
        q = q.where(ProductoTabla.producto_id == producto_id)
    elif informacion_tablas_id:
        q = q.where(ProductoTabla.informacion_tablas_id == informacion_tablas_id)
    q = q.order_by(ProductoTabla.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def create_producto_tabla(db: AsyncSession, data: ProductoTablaCreate) -> ProductoTabla:
    obj = ProductoTabla(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_producto_tabla(
    db: AsyncSession, pt_id: uuid.UUID, data: ProductoTablaUpdate
) -> ProductoTabla | None:
    result = await db.execute(select(ProductoTabla).where(ProductoTabla.id == pt_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_producto_tabla(db: AsyncSession, pt_id: uuid.UUID) -> bool:
    result = await db.execute(select(ProductoTabla).where(ProductoTabla.id == pt_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
