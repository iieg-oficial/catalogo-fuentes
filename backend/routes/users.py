import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import conflict, not_found
from routes.dependencies import require_admin
from schemas.user import UserCreate, UserRead, UserUpdate
from services import users as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserRead])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    return await svc.list_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = await svc.get_user(db, user_id)
    if not obj:
        raise not_found("User")
    return obj


@router.post("/", response_model=UserRead, status_code=201)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = await svc.create_user(db, data)
    if obj is None:
        raise conflict("Email already registered")
    return obj


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = await svc.update_user(db, user_id, data)
    if not obj:
        raise not_found("User")
    return obj


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    deleted = await svc.delete_user(db, user_id)
    if not deleted:
        raise not_found("User")
