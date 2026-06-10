import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import conflict, unauthorized
from models.usuario import Usuario
from routes.dependencies import get_current_user, require_admin
from schemas.auth import ChangePasswordRequest, LoginRequest, TokenResponse, UpdateProfileRequest
from schemas.usuario import UsuarioCreate, UsuarioRead, UsuarioSignup
from services.auth import (
    activate_usuario,
    authenticate_usuario,
    change_password,
    create_access_token,
    get_usuario_by_correo,
    update_profile,
)
from services.usuarios import create_usuario

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

ADMIN_CREATABLE_ROLES = {"maintainer", "viewer"}
SUPERADMIN_CREATABLE_ROLES = {"superadmin", "admin", "maintainer", "viewer"}


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    usuario = await authenticate_usuario(db, data.email, data.password)
    if not usuario:
        raise unauthorized()
    rol_nombre = usuario.rol.nombre if usuario.rol else "viewer"
    token = create_access_token(usuario.correo, rol_nombre)
    logger.info("Usuario %s logged in", usuario.correo)
    return TokenResponse(access_token=token)


@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(data: UsuarioSignup, db: AsyncSession = Depends(get_db)):
    usuario = await get_usuario_by_correo(db, data.correo)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Correo no registrado. Solicita acceso al administrador.",
        )
    if usuario.hashed_password:
        raise conflict("Esta cuenta ya fue configurada. Inicia sesión.")
    await activate_usuario(db, usuario, data.nombre, data.password)
    rol_nombre = usuario.rol.nombre if usuario.rol else "viewer"
    token = create_access_token(usuario.correo, rol_nombre)
    logger.info("Usuario %s completed signup", usuario.correo)
    return TokenResponse(access_token=token)


@router.post("/register", response_model=UsuarioRead, status_code=201)
async def register(
    data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    usuario = await create_usuario(db, data)
    if usuario is None:
        raise conflict("Correo ya registrado")
    logger.info("Admin created usuario %s", usuario.correo)
    return usuario


@router.get("/me", response_model=UsuarioRead)
async def me(current_user: Usuario = Depends(get_current_user)):
    return current_user


@router.put("/password", status_code=204)
async def update_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Change the current user's password."""
    success = await change_password(db, current_user, data.current_password, data.new_password)
    if not success:
        raise unauthorized("Contraseña actual incorrecta")


@router.put("/profile", response_model=UsuarioRead)
async def update_my_profile(
    data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Update the current user's profile."""
    updated = await update_profile(db, current_user, data.nombre)
    return updated
