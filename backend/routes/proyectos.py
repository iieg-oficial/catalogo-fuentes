import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.detail import ProyectoDetail
from schemas.proyecto import ProyectoCreate, ProyectoRead, ProyectoUpdate
from services import proyectos as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/proyectos", tags=["proyectos"])


@router.get("/", response_model=list[ProyectoRead])
async def list_proyectos(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_proyectos(db, skip=skip, limit=limit)


@router.get("/{proyecto_id}", response_model=ProyectoDetail)
async def get_proyecto(
    proyecto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_proyecto_detail(db, proyecto_id)
    if not obj:
        raise not_found("Proyecto")
    return obj


@router.post("/", response_model=ProyectoRead, status_code=201)
async def create_proyecto(
    data: ProyectoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_proyecto(db, data)


@router.put("/{proyecto_id}", response_model=ProyectoRead)
async def update_proyecto(
    proyecto_id: uuid.UUID,
    data: ProyectoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_proyecto(db, proyecto_id, data)
    if not obj:
        raise not_found("Proyecto")
    return obj


@router.delete("/{proyecto_id}", status_code=204)
async def delete_proyecto(
    proyecto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_proyecto(db, proyecto_id)
    if not deleted:
        raise not_found("Proyecto")
