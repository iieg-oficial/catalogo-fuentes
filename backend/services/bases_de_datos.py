import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.base_de_datos import BaseDeDatos
from models.tabla import Tabla
from models.tabla_producto import tabla_producto
from schemas.base_de_datos import BaseDeDatosCreate, BaseDeDatosUpdate


async def list_bases_de_datos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    tabla_id: uuid.UUID | None = None,
    producto_id: uuid.UUID | None = None,
    proyecto_id: uuid.UUID | None = None,
) -> list[BaseDeDatos]:
    q = select(BaseDeDatos).options(selectinload(BaseDeDatos.updated_by))
    if tabla_id:
        q = q.where(
            BaseDeDatos.id.in_(select(Tabla.base_de_datos_id).where(Tabla.id == tabla_id))
        )
    elif producto_id:
        q = q.where(
            BaseDeDatos.id.in_(
                select(Tabla.base_de_datos_id)
                .join(tabla_producto, Tabla.id == tabla_producto.c.tabla_id)
                .where(tabla_producto.c.producto_id == producto_id)
            )
        )
    elif proyecto_id:
        from models.producto import Producto

        q = q.where(
            BaseDeDatos.id.in_(
                select(Tabla.base_de_datos_id)
                .join(tabla_producto, Tabla.id == tabla_producto.c.tabla_id)
                .join(Producto, tabla_producto.c.producto_id == Producto.id)
                .where(Producto.proyecto_id == proyecto_id)
            )
        )
    q = q.order_by(BaseDeDatos.created_at.asc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_base_de_datos(db: AsyncSession, bd_id: uuid.UUID) -> BaseDeDatos | None:
    result = await db.execute(
        select(BaseDeDatos)
        .options(selectinload(BaseDeDatos.updated_by))
        .where(BaseDeDatos.id == bd_id)
    )
    return result.scalar_one_or_none()


async def get_base_de_datos_detail(db: AsyncSession, bd_id: uuid.UUID) -> BaseDeDatos | None:
    from models.producto import Producto
    from models.proyecto import Proyecto  # noqa: F401

    result = await db.execute(
        select(BaseDeDatos)
        .options(
            selectinload(BaseDeDatos.tablas)
            .selectinload(Tabla.productos)
            .selectinload(Producto.proyecto),
            selectinload(BaseDeDatos.instrumentos),
            selectinload(BaseDeDatos.updated_by),
        )
        .where(BaseDeDatos.id == bd_id)
    )
    return result.scalar_one_or_none()


async def create_base_de_datos(db: AsyncSession, data: BaseDeDatosCreate) -> BaseDeDatos:
    obj = BaseDeDatos(
        nombre=data.nombre,
        descripcion=data.descripcion,
        tema=data.tema,
        frecuencia_actualizacion=data.frecuencia_actualizacion,
        meta=data.meta,
    )
    db.add(obj)
    await db.flush()
    await db.commit()
    result = await get_base_de_datos(db, obj.id)
    return result  # type: ignore[return-value]


async def update_base_de_datos(
    db: AsyncSession, bd_id: uuid.UUID, data: BaseDeDatosUpdate, user_id: uuid.UUID
) -> BaseDeDatos | None:
    obj = await get_base_de_datos(db, bd_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    obj.updated_at = datetime.now(timezone.utc)
    obj.updated_by_id = user_id
    await db.commit()
    return await get_base_de_datos(db, bd_id)


async def delete_base_de_datos(db: AsyncSession, bd_id: uuid.UUID) -> bool:
    obj = await get_base_de_datos(db, bd_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
