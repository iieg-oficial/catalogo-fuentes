import json
import logging
import uuid

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import forbidden
from models.user import User, UserRole
from routes.dependencies import get_current_user, require_write
from schemas.meta_column_config import MetaColumnConfigRead, MetaColumnConfigUpdate
from services import meta_column_config as svc
from ws_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meta-columns", tags=["meta-columns"])


async def _enforce_maintainer_ownership(
    db: AsyncSession,
    entity_type: str,
    new_config: dict,
    user_id: uuid.UUID,
) -> None:
    """Raise 403 if maintainer touches columns they don't own; auto-set owner on new columns."""
    current = await svc.get_config(db, entity_type)
    current_extra: dict[str, dict] = {c["key"]: c for c in current.get("extra", [])}
    new_extra: list[dict] = new_config.get("extra", [])

    new_extra_keys = {c["key"] for c in new_extra}
    uid = str(user_id)

    for key, col in current_extra.items():
        if key not in new_extra_keys and col.get("owner_id") != uid:
            raise forbidden()

    for col in new_extra:
        key = col["key"]
        if key not in current_extra:
            col["owner_id"] = uid
        elif current_extra[key].get("owner_id") != uid:
            if col != current_extra[key]:
                raise forbidden()


@router.get("/{entity_type}", response_model=MetaColumnConfigRead)
async def get_meta_columns(
    entity_type: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    config = await svc.get_config(db, entity_type)
    return MetaColumnConfigRead(entity_type=entity_type, config=config)


@router.put("/{entity_type}", response_model=MetaColumnConfigRead)
async def update_meta_columns(
    entity_type: str,
    body: MetaColumnConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write),
):
    if current_user.role == UserRole.maintainer:
        await _enforce_maintainer_ownership(db, entity_type, body.config, current_user.id)
    config = await svc.upsert_config(db, entity_type, body.config)
    await manager.broadcast(entity_type, json.dumps(config))
    return MetaColumnConfigRead(entity_type=entity_type, config=config)


@router.websocket("/ws/{entity_type}")
async def ws_meta_columns(entity_type: str, websocket: WebSocket):
    await manager.connect(entity_type, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(entity_type, websocket)
