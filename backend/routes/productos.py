import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.detail import ProductoDetail
from schemas.producto import ProductoCreate, ProductoRead, ProductoUpdate
from services import productos as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/productos", tags=["productos"])


@router.get("/", response_model=list[ProductoRead])
async def list_productos(
    skip: int = 0,
    limit: int = 10_000,
    proyecto_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_productos(db, skip=skip, limit=limit, proyecto_id=proyecto_id)


@router.get("/{producto_id}", response_model=ProductoDetail)
async def get_producto(
    producto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_producto_detail(db, producto_id)
    if not obj:
        raise not_found("Producto")
    return obj


@router.post("/", response_model=ProductoRead, status_code=201)
async def create_producto(
    data: ProductoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_producto(db, data)


@router.put("/{producto_id}", response_model=ProductoRead)
async def update_producto(
    producto_id: uuid.UUID,
    data: ProductoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_producto(db, producto_id, data)
    if not obj:
        raise not_found("Producto")
    return obj


@router.delete("/{producto_id}", status_code=204)
async def delete_producto(
    producto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_producto(db, producto_id)
    if not deleted:
        raise not_found("Producto")
