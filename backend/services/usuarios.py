import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from consts.roles import ROLE_RANK
from models.rol import Rol
from models.usuario import Usuario
from schemas.usuario import UsuarioCreate, UsuarioUpdate
from services.auth import get_usuario_by_correo, hash_password


async def can_assign_rol(db: AsyncSession, current_user: Usuario, rol_id: uuid.UUID | None) -> bool:
    """Validar que current_user pueda asignar rol_id (rango estrictamente menor al propio).

    Args:
        db: Sesión de base de datos.
        current_user: Usuario que realiza la acción.
        rol_id: Rol a asignar; None significa sin rol (permitido).

    Returns:
        True si la asignación es permitida, False en caso contrario.
    """
    if rol_id is None:
        return True
    actor_rank = ROLE_RANK.get(current_user.rol.nombre, -1) if current_user.rol else -1
    result = await db.execute(select(Rol).where(Rol.id == rol_id))
    target_rol = result.scalar_one_or_none()
    if target_rol is None:
        return False
    return ROLE_RANK.get(target_rol.nombre, -1) < actor_rank


async def list_usuarios(db: AsyncSession, skip: int = 0, limit: int = 10_000) -> list[Usuario]:
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol).selectinload(Rol.permisos))
        .order_by(Usuario.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_usuario(db: AsyncSession, usuario_id: uuid.UUID) -> Usuario | None:
    result = await db.execute(
        select(Usuario)
        .options(selectinload(Usuario.rol).selectinload(Rol.permisos))
        .where(Usuario.id == usuario_id)
    )
    return result.scalar_one_or_none()


async def create_usuario(db: AsyncSession, data: UsuarioCreate) -> Usuario | None:
    existing = await get_usuario_by_correo(db, data.correo)
    if existing:
        return None
    obj = Usuario(
        correo=data.correo,
        nombre=data.nombre,
        rol_id=data.rol_id,
        hashed_password=hash_password(data.password),
        activo=True,
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return await get_usuario(db, obj.id)


async def update_usuario(db: AsyncSession, usuario_id: uuid.UUID, data: UsuarioUpdate) -> Usuario | None:
    obj = await get_usuario(db, usuario_id)
    if not obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    await db.commit()
    return await get_usuario(db, usuario_id)


async def delete_usuario(db: AsyncSession, usuario_id: uuid.UUID) -> bool:
    obj = await get_usuario(db, usuario_id)
    if not obj:
        return False
    await db.delete(obj)
    await db.commit()
    return True
