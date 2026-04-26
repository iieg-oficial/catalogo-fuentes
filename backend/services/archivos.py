import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.archivo import Archivo
from models.instrumento import Instrumento
from models.url import Url
from schemas.archivo import ArchivoCreate, ArchivoUpdate


async def list_archivos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    url_id: uuid.UUID | None = None,
    instrumento_id: uuid.UUID | None = None,
) -> list[Archivo]:
    q = select(Archivo).options(
        selectinload(Archivo.url_ref)
        .selectinload(Url.instrumento)
        .selectinload(Instrumento.base_de_datos)
    )
    if url_id:
        q = q.where(Archivo.url_id == url_id)
    elif instrumento_id:
        q = q.where(
            Archivo.url_id.in_(
                select(Url.id).where(Url.instrumento_id == instrumento_id)
            )
        )
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_archivo(db: AsyncSession, archivo_id: uuid.UUID) -> Archivo | None:
    result = await db.execute(
        select(Archivo)
        .options(
            selectinload(Archivo.url_ref)
            .selectinload(Url.instrumento)
            .selectinload(Instrumento.base_de_datos)
        )
        .where(Archivo.id == archivo_id)
    )
    return result.scalar_one_or_none()


async def create_archivo(db: AsyncSession, data: ArchivoCreate) -> Archivo:
    obj = Archivo(
        url_id=data.url_id,
        descripcion=data.descripcion,
        fecha_publicacion=data.fecha_publicacion,
        fecha_fuente=data.fecha_fuente,
        meta=data.meta,
    )
    db.add(obj)
    await db.flush()
    await db.commit()
    result = await get_archivo(db, obj.id)
    return result  # type: ignore[return-value]


async def update_archivo(db: AsyncSession, archivo_id: uuid.UUID, data: ArchivoUpdate) -> Archivo | None:
    result = await db.execute(select(Archivo).where(Archivo.id == archivo_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    return await get_archivo(db, archivo_id)


async def delete_archivo(db: AsyncSession, archivo_id: uuid.UUID) -> bool:
    result = await db.execute(select(Archivo).where(Archivo.id == archivo_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
