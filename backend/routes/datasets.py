import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.dataset import DatasetCreate, DatasetRead, DatasetUpdate
from schemas.detail import DatasetDetail
from services import datasets as svc

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/", response_model=list[DatasetRead])
async def list_datasets(
    skip: int = 0,
    limit: int = 10_000,
    fuente_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_datasets(db, skip=skip, limit=limit, fuente_id=fuente_id)


@router.get("/{dataset_id}", response_model=DatasetDetail)
async def get_dataset(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_dataset_detail(db, dataset_id)
    if not obj:
        raise not_found("Dataset")
    return obj


@router.post("/", response_model=DatasetRead, status_code=201)
async def create_dataset(
    data: DatasetCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_dataset(db, data)


@router.put("/{dataset_id}", response_model=DatasetRead)
async def update_dataset(
    dataset_id: uuid.UUID,
    data: DatasetUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_dataset(db, dataset_id, data)
    if not obj:
        raise not_found("Dataset")
    return obj


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(
    dataset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_dataset(db, dataset_id)
    if not deleted:
        raise not_found("Dataset")
