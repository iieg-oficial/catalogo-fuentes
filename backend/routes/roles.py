import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import require_admin
from schemas.rol import RolCreate, RolDetail, RolRead, RolUpdate
from services import roles as svc

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("/", response_model=list[RolRead])
async def list_roles(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    return await svc.list_roles(db, skip=skip, limit=limit)


@router.get("/{rol_id}", response_model=RolDetail)
async def get_rol(
    rol_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = await svc.get_rol_detail(db, rol_id)
    if not obj:
        raise not_found("Rol")
    return obj


@router.post("/", response_model=RolRead, status_code=201)
async def create_rol(
    data: RolCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    return await svc.create_rol(db, data)


@router.put("/{rol_id}", response_model=RolRead)
async def update_rol(
    rol_id: uuid.UUID,
    data: RolUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = await svc.update_rol(db, rol_id, data)
    if not obj:
        raise not_found("Rol")
    return obj


@router.delete("/{rol_id}", status_code=204)
async def delete_rol(
    rol_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    deleted = await svc.delete_rol(db, rol_id)
    if not deleted:
        raise not_found("Rol")
