from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db import get_db
from exceptions.http import forbidden, unauthorized
from models.usuario import Usuario
from services.auth import get_usuario_by_correo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        correo: str | None = payload.get("sub")
        if correo is None:
            raise unauthorized()
    except JWTError:
        raise unauthorized()

    usuario = await get_usuario_by_correo(db, correo)
    if usuario is None or not usuario.activo:
        raise unauthorized()
    return usuario


def require_permisos(*permisos: str):
    async def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        user_permisos = set(current_user.permisos)
        if not user_permisos.intersection(permisos):
            raise forbidden()
        return current_user

    return dependency


require_catalog_read = require_permisos("catalog:read")
require_write = require_permisos("catalog:write")
require_admin = require_permisos("users:manage")
require_superadmin = require_permisos("admin:full")
