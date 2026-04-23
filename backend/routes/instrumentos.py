import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from routes.dependencies import get_current_user, require_write
from schemas.detail import InstrumentoDetailFull
from schemas.instrumento import InstrumentoCreate, InstrumentoRead, InstrumentoUpdate
from services import instrumentos as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/instrumentos", tags=["instrumentos"])


@router.get("/", response_model=list[InstrumentoRead])
async def list_instrumentos(
    skip: int = 0,
    limit: int = 100,
    base_de_datos_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await svc.list_instrumentos(db, skip=skip, limit=limit, base_de_datos_id=base_de_datos_id)


@router.get("/{instrumento_id}", response_model=InstrumentoDetailFull)
async def get_instrumento(
    instrumento_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    obj = await svc.get_instrumento_detail(db, instrumento_id)
    if not obj:
        raise not_found("Instrumento")
    return obj


@router.post("/", response_model=InstrumentoRead, status_code=201)
async def create_instrumento(
    data: InstrumentoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    return await svc.create_instrumento(db, data)


@router.put("/{instrumento_id}", response_model=InstrumentoRead)
async def update_instrumento(
    instrumento_id: uuid.UUID,
    data: InstrumentoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    obj = await svc.update_instrumento(db, instrumento_id, data)
    if not obj:
        raise not_found("Instrumento")
    return obj


@router.delete("/{instrumento_id}", status_code=204)
async def delete_instrumento(
    instrumento_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_write),
):
    deleted = await svc.delete_instrumento(db, instrumento_id)
    if not deleted:
        raise not_found("Instrumento")
