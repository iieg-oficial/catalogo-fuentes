import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.detail import DistribucionDetail
from schemas.distribucion import DistribucionCreate, DistribucionRead, DistribucionUpdate
from services import distribuciones as svc

router = APIRouter(prefix="/distribuciones", tags=["distribuciones"])


@router.get("/", response_model=list[DistribucionRead])
async def list_distribuciones(
    skip: int = 0,
    limit: int = 10_000,
    edicion_dataset_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_distribuciones(db, skip=skip, limit=limit, edicion_dataset_id=edicion_dataset_id)


@router.get("/{distribucion_id}", response_model=DistribucionDetail)
async def get_distribucion(
    distribucion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_distribucion_detail(db, distribucion_id)
    if not obj:
        raise not_found("Distribucion")
    return obj


@router.post("/", response_model=DistribucionRead, status_code=201)
async def create_distribucion(
    data: DistribucionCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_distribucion(db, data)


@router.put("/{distribucion_id}", response_model=DistribucionRead)
async def update_distribucion(
    distribucion_id: uuid.UUID,
    data: DistribucionUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_distribucion(db, distribucion_id, data)
    if not obj:
        raise not_found("Distribucion")
    return obj


@router.delete("/{distribucion_id}", status_code=204)
async def delete_distribucion(
    distribucion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_distribucion(db, distribucion_id)
    if not deleted:
        raise not_found("Distribucion")
