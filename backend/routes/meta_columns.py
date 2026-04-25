import json
import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from routes.dependencies import get_current_user, require_write
from schemas.meta_column_config import MetaColumnConfigRead, MetaColumnConfigUpdate
from services import meta_column_config as svc
from ws_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meta-columns", tags=["meta-columns"])


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
    _=Depends(require_write),
):
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
