import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.tipo_de_acceso import TipoDeAccesoCreate, TipoDeAccesoRead, TipoDeAccesoUpdate
from services import tipos_de_acceso as svc

router = APIRouter(prefix="/tipos-de-acceso", tags=["tipos-de-acceso"])


@router.get("/", response_model=list[TipoDeAccesoRead])
async def list_tipos_de_acceso(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_tipos_de_acceso(db, skip=skip, limit=limit)


@router.post("/", response_model=TipoDeAccesoRead, status_code=201)
async def create_tipo_de_acceso(
    data: TipoDeAccesoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_tipo_de_acceso(db, data)


@router.put("/{tipo_id}", response_model=TipoDeAccesoRead)
async def update_tipo_de_acceso(
    tipo_id: uuid.UUID,
    data: TipoDeAccesoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_tipo_de_acceso(db, tipo_id, data)
    if not obj:
        raise not_found("TipoDeAcceso")
    return obj


@router.delete("/{tipo_id}", status_code=204)
async def delete_tipo_de_acceso(
    tipo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_tipo_de_acceso(db, tipo_id)
    if not deleted:
        raise not_found("TipoDeAcceso")
