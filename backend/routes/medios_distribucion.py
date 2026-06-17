import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.medio_distribucion import (
    MedioDistribucionCreate,
    MedioDistribucionRead,
    MedioDistribucionUpdate,
)
from services import medios_distribucion as svc

router = APIRouter(prefix="/medios-distribucion", tags=["medios-distribucion"])


@router.get("/", response_model=list[MedioDistribucionRead])
async def list_medios_distribucion(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_medios_distribucion(db, skip=skip, limit=limit)


@router.post("/", response_model=MedioDistribucionRead, status_code=201)
async def create_medio_distribucion(
    data: MedioDistribucionCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_medio_distribucion(db, data)


@router.put("/{medio_id}", response_model=MedioDistribucionRead)
async def update_medio_distribucion(
    medio_id: uuid.UUID,
    data: MedioDistribucionUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_medio_distribucion(db, medio_id, data)
    if not obj:
        raise not_found("MedioDistribucion")
    return obj


@router.delete("/{medio_id}", status_code=204)
async def delete_medio_distribucion(
    medio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_medio_distribucion(db, medio_id)
    if not deleted:
        raise not_found("MedioDistribucion")
