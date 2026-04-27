from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db import get_db
from exceptions.http import forbidden, unauthorized
from models.user import User
from services.auth import get_user_by_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise unauthorized()
    except JWTError:
        raise unauthorized()

    user = await get_user_by_email(db, email)
    if user is None or not user.is_active:
        raise unauthorized()
    return user


def require_roles(*roles: str):
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in roles:
            raise forbidden()
        return current_user

    return dependency


require_superadmin = require_roles("superadmin")
require_admin = require_roles("admin", "superadmin")
require_write = require_roles("admin", "maintainer", "superadmin")
require_any = require_roles("admin", "maintainer", "viewer", "visualizer", "superadmin")
