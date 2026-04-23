import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.instrumento import Instrumento
from models.url import Url
from schemas.url import UrlCreate, UrlUpdate


async def list_urls(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    instrumento_id: uuid.UUID | None = None,
) -> list[Url]:
    q = select(Url).options(
        selectinload(Url.instrumento).selectinload(Instrumento.base_de_datos)
    )
    if instrumento_id:
        q = q.where(Url.instrumento_id == instrumento_id)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_url(db: AsyncSession, url_id: uuid.UUID) -> Url | None:
    from models.archivo import Archivo
    result = await db.execute(
        select(Url)
        .options(
            selectinload(Url.instrumento).selectinload(Instrumento.base_de_datos),
            selectinload(Url.archivos),
        )
        .where(Url.id == url_id)
    )
    return result.scalar_one_or_none()


async def create_url(db: AsyncSession, data: UrlCreate) -> Url:
    obj = Url(instrumento_id=data.instrumento_id, url=data.url, meta=data.meta)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_url(db: AsyncSession, url_id: uuid.UUID, data: UrlUpdate) -> Url | None:
    obj = await get_url(db, url_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_url(db: AsyncSession, url_id: uuid.UUID) -> bool:
    result = await db.execute(select(Url).where(Url.id == url_id))
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
