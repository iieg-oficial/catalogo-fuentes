import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import require_admin
from schemas.permiso import PermisoCreate, PermisoRead, PermisoUpdate
from services import permisos as svc

router = APIRouter(prefix="/permisos", tags=["permisos"])


@router.get("/", response_model=list[PermisoRead])
async def list_permisos(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    return await svc.list_permisos(db, skip=skip, limit=limit)


@router.post("/", response_model=PermisoRead, status_code=201)
async def create_permiso(
    data: PermisoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    return await svc.create_permiso(db, data)


@router.put("/{permiso_id}", response_model=PermisoRead)
async def update_permiso(
    permiso_id: uuid.UUID,
    data: PermisoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = await svc.update_permiso(db, permiso_id, data)
    if not obj:
        raise not_found("Permiso")
    return obj


@router.delete("/{permiso_id}", status_code=204)
async def delete_permiso(
    permiso_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    deleted = await svc.delete_permiso(db, permiso_id)
    if not deleted:
        raise not_found("Permiso")
