import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import conflict, forbidden, unauthorized
from models.user import User, UserRole
from routes.dependencies import get_current_user, require_admin
from routes.users import _ADMIN_CREATABLE, _SUPERADMIN_CREATABLE
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import UserCreate, UserRead, UserSignup
from services.auth import authenticate_user, create_access_token, get_user_by_email, hash_password
from services.users import create_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise unauthorized()
    token = create_access_token(user.email, user.role.value)
    logger.info("User %s logged in", user.email)
    return TokenResponse(access_token=token)


@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(data: UserSignup, db: AsyncSession = Depends(get_db)):
    """Complete registration for a pre-registered email."""
    user = await get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Correo no registrado. Solicita acceso al administrador.",
        )
    if user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta cuenta ya fue configurada. Inicia sesión.",
        )
    user.hashed_password = hash_password(data.password)
    user.is_active = True
    await db.commit()
    token = create_access_token(user.email, user.role.value)
    logger.info("User %s completed signup", user.email)
    return TokenResponse(access_token=token)


@router.post("/register", response_model=UserRead, status_code=201)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    allowed = _SUPERADMIN_CREATABLE if current_user.role == UserRole.superadmin else _ADMIN_CREATABLE
    if data.role not in allowed:
        raise forbidden()
    user = await create_user(db, data)
    if user is None:
        raise conflict("Email already registered")
    logger.info("Admin created user %s with role %s", user.email, user.role)
    return user


@router.get("/me", response_model=UserRead)
async def me(current_user=Depends(get_current_user)):
    return current_user
