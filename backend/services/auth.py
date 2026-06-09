from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from models.rol import Rol
from models.usuario import Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, rol: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": subject, "rol": rol, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


async def get_usuario_by_correo(db: AsyncSession, correo: str) -> Usuario | None:
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol).selectinload(Rol.permisos))
        .where(Usuario.correo == correo)
    )
    return result.scalar_one_or_none()


async def activate_usuario(db: AsyncSession, usuario: Usuario, nombre: str, password: str) -> Usuario:
    usuario.nombre = nombre
    usuario.hashed_password = hash_password(password)
    usuario.activo = True
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def change_password(db: AsyncSession, usuario: Usuario, current_password: str, new_password: str) -> bool:
    """Change a user's password after verifying the current one."""
    if not usuario.hashed_password or not verify_password(current_password, usuario.hashed_password):
        return False
    usuario.hashed_password = hash_password(new_password)
    await db.commit()
    return True


async def update_profile(db: AsyncSession, usuario: Usuario, nombre: str) -> Usuario:
    """Update a user's profile name."""
    usuario.nombre = nombre
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def authenticate_usuario(db: AsyncSession, correo: str, password: str) -> Usuario | None:
    usuario = await get_usuario_by_correo(db, correo)
    if not usuario or not usuario.activo or not usuario.hashed_password:
        return None
    if not verify_password(password, usuario.hashed_password):
        return None
    return usuario
