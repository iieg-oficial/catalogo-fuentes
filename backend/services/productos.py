import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.dataset import Dataset
from models.distribucion import Distribucion
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


async def list_producto_datasets(
    db: AsyncSession, producto_id: uuid.UUID
) -> list[Dataset]:
    """Read-only list of datasets that feed a producto through the physical chain.

    producto -> informacion_tablas -> base_de_datos -> archivo -> distribucion -> dataset.
    Each foreign key is optional, so only datasets reachable through the complete
    chain are returned. DISTINCT collapses the many-to-many fan-out of that path.
    """
    q = (
        select(Dataset)
        .join(Distribucion, Distribucion.dataset_id == Dataset.id)
        .join(Archivo, Archivo.distribucion_id == Distribucion.id)
        .join(BaseDeDatos, BaseDeDatos.archivo_id == Archivo.id)
        .join(InformacionTablas, InformacionTablas.base_de_datos_id == BaseDeDatos.id)
        .where(InformacionTablas.producto_id == producto_id)
        .options(selectinload(Dataset.fuente), selectinload(Dataset.tipo_dataset))
        .distinct()
        .order_by(Dataset.nombre.asc())
    )
    result = await db.execute(q)
    return list(result.scalars().all())


async def list_all_producto_datasets(
    db: AsyncSession,
) -> dict[str, list[Dataset]]:
    """Datasets feeding every producto, grouped by producto id.

    Single query over the physical chain so the productos grid can render the
    dataset list inline without one request per row. Same chain and DISTINCT
    semantics as ``list_producto_datasets``.
    """
    q = (
        select(InformacionTablas.producto_id, Dataset)
        .join(BaseDeDatos, BaseDeDatos.id == InformacionTablas.base_de_datos_id)
        .join(Archivo, Archivo.id == BaseDeDatos.archivo_id)
        .join(Distribucion, Distribucion.id == Archivo.distribucion_id)
        .join(Dataset, Dataset.id == Distribucion.dataset_id)
        .where(InformacionTablas.producto_id.is_not(None))
        .options(selectinload(Dataset.fuente), selectinload(Dataset.tipo_dataset))
        .distinct()
        .order_by(Dataset.nombre.asc())
    )
    result = await db.execute(q)
    grouped: dict[str, list[Dataset]] = {}
    for producto_id, dataset in result.all():
        grouped.setdefault(str(producto_id), []).append(dataset)
    return grouped


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
