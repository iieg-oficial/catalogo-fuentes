from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.meta_column_config import MetaColumnConfig


async def get_config(db: AsyncSession, entity_type: str) -> dict:
    result = await db.execute(
        select(MetaColumnConfig).where(MetaColumnConfig.entity_type == entity_type)
    )
    row = result.scalar_one_or_none()
    return row.config if row else {}


async def upsert_config(db: AsyncSession, entity_type: str, config: dict) -> dict:
    result = await db.execute(
        select(MetaColumnConfig).where(MetaColumnConfig.entity_type == entity_type)
    )
    row = result.scalar_one_or_none()
    if row:
        row.config = config
    else:
        row = MetaColumnConfig(entity_type=entity_type, config=config)
        db.add(row)
    await db.commit()
    return config
