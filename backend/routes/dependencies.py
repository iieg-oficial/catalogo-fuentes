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


def require_roles(*roles: str):
    async def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not current_user.rol or current_user.rol.nombre not in roles:
            raise forbidden()
        return current_user

    return dependency


require_superadmin = require_roles("superadmin")
require_admin = require_roles("admin", "superadmin")
require_write = require_roles("admin", "maintainer", "superadmin")
require_any = require_roles("admin", "maintainer", "viewer", "visualizer", "superadmin")
