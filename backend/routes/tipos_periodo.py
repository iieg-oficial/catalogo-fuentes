import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.tipo_periodo import TipoPeriodoCreate, TipoPeriodoRead, TipoPeriodoUpdate
from services import tipos_periodo as svc

router = APIRouter(prefix="/tipos-periodo", tags=["tipos-periodo"])


@router.get("/", response_model=list[TipoPeriodoRead])
async def list_tipos_periodo(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_tipos_periodo(db, skip=skip, limit=limit)


@router.post("/", response_model=TipoPeriodoRead, status_code=201)
async def create_tipo_periodo(
    data: TipoPeriodoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_tipo_periodo(db, data)


@router.put("/{tipo_id}", response_model=TipoPeriodoRead)
async def update_tipo_periodo(
    tipo_id: uuid.UUID,
    data: TipoPeriodoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_tipo_periodo(db, tipo_id, data)
    if not obj:
        raise not_found("TipoPeriodo")
    return obj


@router.delete("/{tipo_id}", status_code=204)
async def delete_tipo_periodo(
    tipo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_tipo_periodo(db, tipo_id)
    if not deleted:
        raise not_found("TipoPeriodo")
