import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.producto import Producto
from models.tabla import Tabla
from models.tabla_producto import tabla_producto
from schemas.tabla import TablaCreate, TablaUpdate


async def list_tablas(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    base_de_datos_id: uuid.UUID | None = None,
    producto_id: uuid.UUID | None = None,
    proyecto_id: uuid.UUID | None = None,
) -> list[Tabla]:
    q = select(Tabla).options(
        selectinload(Tabla.base_de_datos),
        selectinload(Tabla.productos).selectinload(Producto.proyecto),
    )
    if base_de_datos_id:
        q = q.where(Tabla.base_de_datos_id == base_de_datos_id)
    if producto_id:
        q = q.where(
            Tabla.id.in_(
                select(tabla_producto.c.tabla_id).where(
                    tabla_producto.c.producto_id == producto_id
                )
            )
        )
    if proyecto_id:
        q = q.where(
            Tabla.id.in_(
                select(tabla_producto.c.tabla_id)
                .join(Producto, tabla_producto.c.producto_id == Producto.id)
                .where(Producto.proyecto_id == proyecto_id)
            )
        )
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().unique().all())


async def get_tabla(db: AsyncSession, tabla_id: uuid.UUID) -> Tabla | None:
    result = await db.execute(
        select(Tabla)
        .options(
            selectinload(Tabla.base_de_datos),
            selectinload(Tabla.productos).selectinload(Producto.proyecto),
        )
        .where(Tabla.id == tabla_id)
    )
    return result.scalar_one_or_none()


async def create_tabla(db: AsyncSession, data: TablaCreate) -> Tabla:
    obj = Tabla(
        base_de_datos_id=data.base_de_datos_id,
        nombre=data.nombre,
        campos=data.campos,
        meta=data.meta,
    )
    db.add(obj)
    await db.flush()

    if data.producto_ids:
        productos = await db.execute(
            select(Producto).where(Producto.id.in_(data.producto_ids))
        )
        obj.productos = list(productos.scalars().all())

    await db.commit()
    await db.refresh(obj)
    return obj


async def update_tabla(db: AsyncSession, tabla_id: uuid.UUID, data: TablaUpdate) -> Tabla | None:
    obj = await get_tabla(db, tabla_id)
    if not obj:
        return None
    update_data = data.model_dump(exclude_unset=True, exclude={"producto_ids"})
    for key, value in update_data.items():
        setattr(obj, key, value)

    if data.producto_ids is not None:
        productos = await db.execute(
            select(Producto).where(Producto.id.in_(data.producto_ids))
        )
        obj.productos = list(productos.scalars().all())

    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_tabla(db: AsyncSession, tabla_id: uuid.UUID) -> bool:
    result = await db.execute(select(Tabla).where(Tabla.id == tabla_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
