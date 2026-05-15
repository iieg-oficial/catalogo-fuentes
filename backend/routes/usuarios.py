import logging
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import conflict, forbidden, not_found
from models.usuario import Usuario
from routes.dependencies import require_admin
from schemas.usuario import UsuarioCreate, UsuarioRead, UsuarioUpdate
from services import usuarios as svc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("/", response_model=list[UsuarioRead])
async def list_usuarios(
    skip: int = 0,
    limit: int = 10_000,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    return await svc.list_usuarios(db, skip=skip, limit=limit)


@router.get("/{usuario_id}", response_model=UsuarioRead)
async def get_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = await svc.get_usuario(db, usuario_id)
    if not obj:
        raise not_found("Usuario")
    return obj


@router.post("/", response_model=UsuarioRead, status_code=201)
async def create_usuario(
    data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    obj = await svc.create_usuario(db, data)
    if obj is None:
        raise conflict("Correo ya registrado")
    return obj


@router.put("/{usuario_id}", response_model=UsuarioRead)
async def update_usuario(
    usuario_id: uuid.UUID,
    data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    target = await svc.get_usuario(db, usuario_id)
    if not target:
        raise not_found("Usuario")
    if target.rol and target.rol.nombre == "superadmin":
        raise forbidden()
    obj = await svc.update_usuario(db, usuario_id, data)
    return obj


@router.delete("/{usuario_id}", status_code=204)
async def delete_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    deleted = await svc.delete_usuario(db, usuario_id)
    if not deleted:
        raise not_found("Usuario")
