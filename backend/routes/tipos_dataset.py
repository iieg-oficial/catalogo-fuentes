import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.tipo_dataset import TipoDatasetCreate, TipoDatasetRead, TipoDatasetUpdate
from services import tipos_dataset as svc

router = APIRouter(prefix="/tipos-dataset", tags=["tipos-dataset"])


@router.get("/", response_model=list[TipoDatasetRead])
async def list_tipos_dataset(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_tipos_dataset(db, skip=skip, limit=limit)


@router.post("/", response_model=TipoDatasetRead, status_code=201)
async def create_tipo_dataset(
    data: TipoDatasetCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_tipo_dataset(db, data)


@router.put("/{tipo_id}", response_model=TipoDatasetRead)
async def update_tipo_dataset(
    tipo_id: uuid.UUID,
    data: TipoDatasetUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_tipo_dataset(db, tipo_id, data)
    if not obj:
        raise not_found("TipoDataset")
    return obj


@router.delete("/{tipo_id}", status_code=204)
async def delete_tipo_dataset(
    tipo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_tipo_dataset(db, tipo_id)
    if not deleted:
        raise not_found("TipoDataset")
