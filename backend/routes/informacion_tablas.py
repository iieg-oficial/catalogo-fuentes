import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.informacion_tablas import InformacionTablasCreate, InformacionTablasRead, InformacionTablasUpdate
from services import informacion_tablas as svc

router = APIRouter(prefix="/informacion-tablas", tags=["informacion-tablas"])


@router.get("/", response_model=list[InformacionTablasRead])
async def list_informacion_tablas(
    skip: int = 0,
    limit: int = 10_000,
    base_de_datos_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_informacion_tablas(db, skip=skip, limit=limit, base_de_datos_id=base_de_datos_id)


@router.get("/{tabla_id}", response_model=InformacionTablasRead)
async def get_informacion_tabla(
    tabla_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_informacion_tabla(db, tabla_id)
    if not obj:
        raise not_found("InformacionTablas")
    return obj


@router.post("/", response_model=InformacionTablasRead, status_code=201)
async def create_informacion_tabla(
    data: InformacionTablasCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_informacion_tabla(db, data)


@router.put("/{tabla_id}", response_model=InformacionTablasRead)
async def update_informacion_tabla(
    tabla_id: uuid.UUID,
    data: InformacionTablasUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_informacion_tabla(db, tabla_id, data)
    if not obj:
        raise not_found("InformacionTablas")
    return obj


@router.delete("/{tabla_id}", status_code=204)
async def delete_informacion_tabla(
    tabla_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_informacion_tabla(db, tabla_id)
    if not deleted:
        raise not_found("InformacionTablas")
