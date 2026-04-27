import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from models.user import User
from routes.dependencies import get_current_user, require_write
from schemas.archivo import ArchivoCreate, ArchivoRead, ArchivoUpdate
from services import archivos as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/archivos", tags=["archivos"])


@router.get("/", response_model=list[ArchivoRead])
async def list_archivos(
    skip: int = 0,
    limit: int = 100,
    url_id: uuid.UUID | None = None,
    instrumento_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_archivos(
        db, skip=skip, limit=limit, url_id=url_id, instrumento_id=instrumento_id
    )


@router.get("/{archivo_id}", response_model=ArchivoRead)
async def get_archivo(
    archivo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_archivo(db, archivo_id)
    if not obj:
        raise not_found("Archivo")
    return obj


@router.post("/", response_model=ArchivoRead, status_code=201)
async def create_archivo(
    data: ArchivoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_archivo(db, data)


@router.put("/{archivo_id}", response_model=ArchivoRead)
async def update_archivo(
    archivo_id: uuid.UUID,
    data: ArchivoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write),
):
    obj = await svc.update_archivo(db, archivo_id, data, current_user.id)
    if not obj:
        raise not_found("Archivo")
    return obj


@router.delete("/{archivo_id}", status_code=204)
async def delete_archivo(
    archivo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_archivo(db, archivo_id)
    if not deleted:
        raise not_found("Archivo")
