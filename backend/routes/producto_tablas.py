import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.producto_tabla import ProductoTablaCreate, ProductoTablaUpdate, ProductoTablaRead
from services import producto_tablas as svc

router = APIRouter(prefix="/producto-tablas", tags=["producto-tablas"])


@router.get("/", response_model=list[ProductoTablaRead])
async def list_producto_tablas(
    producto_id: uuid.UUID | None = None,
    informacion_tablas_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_producto_tablas(
        db, producto_id=producto_id, informacion_tablas_id=informacion_tablas_id
    )


@router.post("/", response_model=ProductoTablaRead, status_code=201)
async def create_producto_tabla(
    data: ProductoTablaCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_producto_tabla(db, data)


@router.put("/{pt_id}", response_model=ProductoTablaRead)
async def update_producto_tabla(
    pt_id: uuid.UUID,
    data: ProductoTablaUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_producto_tabla(db, pt_id, data)
    if not obj:
        raise not_found("ProductoTabla")
    return obj


@router.delete("/{pt_id}", status_code=204)
async def delete_producto_tabla(
    pt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_producto_tabla(db, pt_id)
    if not deleted:
        raise not_found("ProductoTabla")
