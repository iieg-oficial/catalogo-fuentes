import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import conflict, forbidden, not_found
from models.user import User, UserRole
from routes.dependencies import require_admin
from schemas.user import UserCreate, UserRead, UserUpdate
from services import users as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])

# Roles each tier is allowed to create
_ADMIN_CREATABLE = {UserRole.maintainer, UserRole.visualizer, UserRole.viewer}
_SUPERADMIN_CREATABLE = set(UserRole)


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
    current_user: User = Depends(require_admin),
):
    allowed = _SUPERADMIN_CREATABLE if current_user.role == UserRole.superadmin else _ADMIN_CREATABLE
    if data.role not in allowed:
        raise forbidden()
    obj = await svc.create_user(db, data)
    if obj is None:
        raise conflict("Email already registered")
    return obj


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    target = await svc.get_user(db, user_id)
    if not target:
        raise not_found("User")
    if target.role == UserRole.superadmin:
        raise forbidden()
    if data.role is not None and current_user.role == UserRole.admin:
        if data.role not in {UserRole.maintainer, UserRole.visualizer, UserRole.viewer}:
            raise forbidden()
    obj = await svc.update_user(db, user_id, data)
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
