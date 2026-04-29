import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from models.user import User
from routes.dependencies import get_current_user, require_write
from schemas.base_de_datos import BaseDeDatosCreate, BaseDeDatosRead, BaseDeDatosUpdate
from schemas.detail import BaseDeDatosDetail
from services import bases_de_datos as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bases-de-datos", tags=["bases_de_datos"])


@router.get("/", response_model=list[BaseDeDatosRead])
async def list_bases_de_datos(
    skip: int = 0,
    limit: int = 10_000,
    tabla_id: uuid.UUID | None = None,
    producto_id: uuid.UUID | None = None,
    proyecto_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_bases_de_datos(
        db,
        skip=skip,
        limit=limit,
        tabla_id=tabla_id,
        producto_id=producto_id,
        proyecto_id=proyecto_id,
    )


@router.get("/{bd_id}", response_model=BaseDeDatosDetail)
async def get_base_de_datos(
    bd_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_base_de_datos_detail(db, bd_id)
    if not obj:
        raise not_found("BaseDeDatos")
    return obj


@router.post("/", response_model=BaseDeDatosRead, status_code=201)
async def create_base_de_datos(
    data: BaseDeDatosCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_base_de_datos(db, data)


@router.put("/{bd_id}", response_model=BaseDeDatosRead)
async def update_base_de_datos(
    bd_id: uuid.UUID,
    data: BaseDeDatosUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write),
):
    obj = await svc.update_base_de_datos(db, bd_id, data, current_user.id)
    if not obj:
        raise not_found("BaseDeDatos")
    return obj


@router.delete("/{bd_id}", status_code=204)
async def delete_base_de_datos(
    bd_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_base_de_datos(db, bd_id)
    if not deleted:
        raise not_found("BaseDeDatos")
