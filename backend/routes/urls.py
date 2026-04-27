import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from models.user import User
from routes.dependencies import get_current_user, require_write
from schemas.detail import UrlDetailFull
from schemas.url import UrlCreate, UrlRead, UrlUpdate
from services import urls as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/urls", tags=["urls"])


@router.get("/", response_model=list[UrlRead])
async def list_urls(
    skip: int = 0,
    limit: int = 100,
    instrumento_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_urls(db, skip=skip, limit=limit, instrumento_id=instrumento_id)


@router.get("/{url_id}", response_model=UrlDetailFull)
async def get_url(
    url_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_url(db, url_id)
    if not obj:
        raise not_found("Url")
    return obj


@router.post("/", response_model=UrlRead, status_code=201)
async def create_url(
    data: UrlCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_url(db, data)


@router.put("/{url_id}", response_model=UrlRead)
async def update_url(
    url_id: uuid.UUID,
    data: UrlUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write),
):
    obj = await svc.update_url(db, url_id, data, current_user.id)
    if not obj:
        raise not_found("Url")
    return obj


@router.delete("/{url_id}", status_code=204)
async def delete_url(
    url_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_url(db, url_id)
    if not deleted:
        raise not_found("Url")
