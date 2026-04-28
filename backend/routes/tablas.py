import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from models.user import User
from routes.dependencies import get_current_user, require_write
from schemas.tabla import TablaCreate, TablaDetail, TablaRead, TablaUpdate
from services import tablas as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tablas", tags=["tablas"])


@router.get("/", response_model=list[TablaDetail])
async def list_tablas(
    skip: int = 0,
    limit: int = 10_000,
    base_de_datos_id: uuid.UUID | None = None,
    producto_id: uuid.UUID | None = None,
    proyecto_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_tablas(
        db,
        skip=skip,
        limit=limit,
        base_de_datos_id=base_de_datos_id,
        producto_id=producto_id,
        proyecto_id=proyecto_id,
    )


@router.get("/{tabla_id}", response_model=TablaDetail)
async def get_tabla(
    tabla_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_tabla(db, tabla_id)
    if not obj:
        raise not_found("Tabla")
    return obj


@router.post("/", response_model=TablaDetail, status_code=201)
async def create_tabla(
    data: TablaCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_tabla(db, data)


@router.put("/{tabla_id}", response_model=TablaDetail)
async def update_tabla(
    tabla_id: uuid.UUID,
    data: TablaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write),
):
    obj = await svc.update_tabla(db, tabla_id, data, current_user.id)
    if not obj:
        raise not_found("Tabla")
    return obj


@router.delete("/{tabla_id}", status_code=204)
async def delete_tabla(
    tabla_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_tabla(db, tabla_id)
    if not deleted:
        raise not_found("Tabla")
