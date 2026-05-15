import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.detail import FuenteDetail
from schemas.fuente import FuenteCreate, FuenteRead, FuenteUpdate
from services import fuentes as svc

router = APIRouter(prefix="/fuentes", tags=["fuentes"])


@router.get("/", response_model=list[FuenteRead])
async def list_fuentes(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_fuentes(db, skip=skip, limit=limit)


@router.get("/{fuente_id}", response_model=FuenteDetail)
async def get_fuente(
    fuente_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_fuente_detail(db, fuente_id)
    if not obj:
        raise not_found("Fuente")
    return obj


@router.post("/", response_model=FuenteRead, status_code=201)
async def create_fuente(
    data: FuenteCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_fuente(db, data)


@router.put("/{fuente_id}", response_model=FuenteRead)
async def update_fuente(
    fuente_id: uuid.UUID,
    data: FuenteUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_fuente(db, fuente_id, data)
    if not obj:
        raise not_found("Fuente")
    return obj


@router.delete("/{fuente_id}", status_code=204)
async def delete_fuente(
    fuente_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_fuente(db, fuente_id)
    if not deleted:
        raise not_found("Fuente")
