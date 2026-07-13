import os
import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("POSTGRES_PASSWORD", "iieg_secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("SUPERADMIN_PASSWORD", "Super1234!")
os.environ.setdefault("POSTGRES_DB", "dashboard_tracking_test")
os.environ.setdefault("POSTGRES_PORT", "5433")
os.environ.setdefault("POSTGRES_USER", "iieg")

import models  # noqa: E402,F401 — ensures all models are registered
from config import settings  # noqa: E402
from db import Base  # noqa: E402
from db import get_db as app_get_db  # noqa: E402
from models.usuario import Usuario  # noqa: E402
from models.rol import Rol  # noqa: E402
from models.permiso import Permiso  # noqa: E402
from models.permiso_rol import PermisoRol  # noqa: E402
from services.auth import hash_password  # noqa: E402


@pytest_asyncio.fixture(scope="function")
async def _test_engine():
    engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(_test_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(_test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def app_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    from main import app

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[app_get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


async def _crear_usuario_con_permisos(
    db: AsyncSession, correo: str, permisos: list[str]
) -> Usuario:
    rol = Rol(nombre=f"rol-{uuid.uuid4().hex[:8]}")
    db.add(rol)
    await db.flush()
    for nombre_permiso in permisos:
        permiso = Permiso(nombre=nombre_permiso)
        db.add(permiso)
        await db.flush()
        db.add(PermisoRol(rol_id=rol.id, permiso_id=permiso.id))
    usuario = Usuario(
        correo=correo,
        hashed_password=hash_password("Password123!"),
        nombre="Test",
        rol_id=rol.id,
        activo=True,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


@pytest_asyncio.fixture
async def admin_token(db_session: AsyncSession) -> str:
    from services.auth import create_access_token

    usuario = await _crear_usuario_con_permisos(
        db_session, "admin@test.local", ["users:manage"]
    )
    return create_access_token(usuario.correo, "admin")


@pytest_asyncio.fixture
async def maintainer_token(db_session: AsyncSession) -> str:
    from services.auth import create_access_token

    usuario = await _crear_usuario_con_permisos(
        db_session, "maintainer@test.local", ["catalog:write"]
    )
    return create_access_token(usuario.correo, "maintainer")
