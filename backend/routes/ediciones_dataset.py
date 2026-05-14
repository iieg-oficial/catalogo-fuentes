import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.detail import EdicionDatasetDetail
from schemas.edicion_dataset import EdicionDatasetCreate, EdicionDatasetRead, EdicionDatasetUpdate
from services import ediciones_dataset as svc

router = APIRouter(prefix="/ediciones-dataset", tags=["ediciones-dataset"])


@router.get("/", response_model=list[EdicionDatasetRead])
async def list_ediciones(
    skip: int = 0,
    limit: int = 10_000,
    dataset_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_ediciones_dataset(db, skip=skip, limit=limit, dataset_id=dataset_id)


@router.get("/{edicion_id}", response_model=EdicionDatasetDetail)
async def get_edicion(
    edicion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_edicion_dataset_detail(db, edicion_id)
    if not obj:
        raise not_found("EdicionDataset")
    return obj


@router.post("/", response_model=EdicionDatasetRead, status_code=201)
async def create_edicion(
    data: EdicionDatasetCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_edicion_dataset(db, data)


@router.put("/{edicion_id}", response_model=EdicionDatasetRead)
async def update_edicion(
    edicion_id: uuid.UUID,
    data: EdicionDatasetUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_edicion_dataset(db, edicion_id, data)
    if not obj:
        raise not_found("EdicionDataset")
    return obj


@router.delete("/{edicion_id}", status_code=204)
async def delete_edicion(
    edicion_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_edicion_dataset(db, edicion_id)
    if not deleted:
        raise not_found("EdicionDataset")
