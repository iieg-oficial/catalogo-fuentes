import asyncio
import logging
import subprocess
from datetime import date
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import models  # noqa: F401
from config import settings
from consts.roles import ADMIN, MAINTAINER, SUPERADMIN, VIEWER, VISUALIZER
from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.dataset import Dataset
from models.distribucion import Distribucion
from models.edicion_dataset import EdicionDataset
from models.fuente import Fuente
from models.informacion_tablas import InformacionTablas
from models.permiso import Permiso
from models.permiso_rol import PermisoRol
from models.producto import Producto
from models.producto_tabla import ProductoTabla
from models.proyecto import Proyecto
from models.rol import Rol
from models.usuario import Usuario
from services.auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_rbac(db: AsyncSession) -> dict[str, Rol]:
    """Create default roles and permissions."""
    result = await db.execute(select(Rol).where(Rol.nombre == SUPERADMIN))
    if result.scalar_one_or_none():
        logger.info("RBAC already seeded, fetching existing roles.")
        result = await db.execute(select(Rol))
        roles = {r.nombre: r for r in result.scalars().all()}
        return roles

    logger.info("Seeding RBAC...")

    p_catalog_read = Permiso(nombre="catalog:read", descripcion="Leer catálogo")
    p_catalog_write = Permiso(nombre="catalog:write", descripcion="Escribir catálogo")
    p_users_manage = Permiso(nombre="users:manage", descripcion="Gestionar usuarios")
    p_admin_full = Permiso(nombre="admin:full", descripcion="Acceso completo de administración")
    db.add_all([p_catalog_read, p_catalog_write, p_users_manage, p_admin_full])
    await db.flush()

    rol_superadmin = Rol(nombre=SUPERADMIN, descripcion="Control total del sistema")
    rol_admin = Rol(nombre=ADMIN, descripcion="Administración de usuarios y catálogo")
    rol_maintainer = Rol(nombre=MAINTAINER, descripcion="Edición del catálogo")
    rol_viewer = Rol(nombre=VIEWER, descripcion="Solo lectura (legado)")
    rol_visualizer = Rol(nombre=VISUALIZER, descripcion="Solo lectura")
    db.add_all([rol_superadmin, rol_admin, rol_maintainer, rol_viewer, rol_visualizer])
    await db.flush()

    links = [
        PermisoRol(permiso_id=p_admin_full.id, rol_id=rol_superadmin.id),
        PermisoRol(permiso_id=p_catalog_read.id, rol_id=rol_superadmin.id),
        PermisoRol(permiso_id=p_catalog_write.id, rol_id=rol_superadmin.id),
        PermisoRol(permiso_id=p_users_manage.id, rol_id=rol_superadmin.id),
        PermisoRol(permiso_id=p_catalog_read.id, rol_id=rol_admin.id),
        PermisoRol(permiso_id=p_catalog_write.id, rol_id=rol_admin.id),
        PermisoRol(permiso_id=p_users_manage.id, rol_id=rol_admin.id),
        PermisoRol(permiso_id=p_catalog_read.id, rol_id=rol_maintainer.id),
        PermisoRol(permiso_id=p_catalog_write.id, rol_id=rol_maintainer.id),
        PermisoRol(permiso_id=p_catalog_read.id, rol_id=rol_viewer.id),
        PermisoRol(permiso_id=p_catalog_read.id, rol_id=rol_visualizer.id),
    ]
    db.add_all(links)
    await db.flush()
    logger.info("RBAC seeded.")

    return {
        SUPERADMIN: rol_superadmin,
        ADMIN: rol_admin,
        MAINTAINER: rol_maintainer,
        VIEWER: rol_viewer,
        VISUALIZER: rol_visualizer,
    }


async def seed_superadmin(db: AsyncSession) -> None:
    """Production init: only creates superadmin from env vars."""
    roles = await seed_rbac(db)
    await db.commit()

    result = await db.execute(select(Usuario).where(Usuario.correo == settings.SUPERADMIN_EMAIL))
    if result.scalar_one_or_none():
        logger.info("Superadmin already exists, skipping.")
        return
    superadmin = Usuario(
        correo=settings.SUPERADMIN_EMAIL,
        nombre="Super Admin",
        hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
        rol_id=roles[SUPERADMIN].id,
    )
    db.add(superadmin)
    await db.commit()
    logger.info("Superadmin created: %s", settings.SUPERADMIN_EMAIL)


async def seed_users(db: AsyncSession, roles: dict[str, Rol]) -> None:
    """Development seed: creates dummy users for testing."""
    result = await db.execute(select(Usuario).where(Usuario.correo == "admin@iieg.gob.mx"))
    if result.scalar_one_or_none():
        logger.info("Users already seeded, skipping.")
        return
    superadmin = Usuario(
        correo=settings.SUPERADMIN_EMAIL,
        nombre="Super Admin",
        hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
        rol_id=roles[SUPERADMIN].id,
    )
    admin = Usuario(
        correo="admin@iieg.gob.mx",
        nombre="Administrador",
        hashed_password=hash_password("Admin1234!"),
        rol_id=roles[ADMIN].id,
    )
    maintainer = Usuario(
        correo="editor@iieg.gob.mx",
        nombre="Editor",
        hashed_password=hash_password("Editor1234!"),
        rol_id=roles[MAINTAINER].id,
    )
    visualizer = Usuario(
        correo="consulta@iieg.gob.mx",
        nombre="Consulta",
        hashed_password=hash_password("Viewer1234!"),
        rol_id=roles[VISUALIZER].id,
    )
    db.add_all([superadmin, admin, maintainer, visualizer])
    await db.flush()
    logger.info("Users seeded.")


async def seed_catalog(db: AsyncSession) -> None:
    """Development seed: creates dummy catalog data for testing."""
    result = await db.execute(select(Fuente))
    if result.scalars().first():
        logger.info("Catalog already seeded, skipping.")
        return

    logger.info("Seeding catalog...")

    # Fuentes
    inegi = Fuente(
        nombre="INEGI",
        nombre_corto="INEGI",
        sector="Gobierno",
        ambito="Federal",
        descripcion="Instituto Nacional de Estadística y Geografía",
        es_fuente_oficial=True,
        es_publicador=True,
        jurisdiccion="Nacional",
    )
    conapo = Fuente(
        nombre="CONAPO",
        nombre_corto="CONAPO",
        sector="Gobierno",
        ambito="Federal",
        descripcion="Consejo Nacional de Población",
        es_fuente_oficial=True,
        es_publicador=True,
        jurisdiccion="Nacional",
    )
    siap = Fuente(
        nombre="SIAP",
        nombre_corto="SIAP",
        sector="Gobierno",
        ambito="Federal",
        descripcion="Servicio de Información Agroalimentaria y Pesquera",
        es_fuente_oficial=True,
        es_publicador=True,
        jurisdiccion="Nacional",
    )
    db.add_all([inegi, conapo, siap])
    await db.flush()

    # Datasets
    ds_enoe = Dataset(
        nombre="ENOE",
        nombre_corto="ENOE",
        descripcion="Encuesta Nacional de Ocupación y Empleo",
        periodicidad="trimestral",
        vigente=True,
        tema_principal="empleo",
        fuente_id=inegi.id,
    )
    ds_conapo_proy = Dataset(
        nombre="Proyecciones de Población",
        nombre_corto="CONAPO-PROY",
        descripcion="Proyecciones de la población de México y entidades federativas 2020-2050",
        periodicidad="anual",
        vigente=True,
        tema_principal="demografía",
        fuente_id=conapo.id,
    )
    ds_siap_prod = Dataset(
        nombre="Producción Agropecuaria",
        nombre_corto="SIAP-PROD",
        descripcion="Cifras de producción agrícola y pecuaria por municipio",
        periodicidad="anual",
        vigente=True,
        tema_principal="agricultura",
        fuente_id=siap.id,
    )
    ds_denue = Dataset(
        nombre="DENUE",
        nombre_corto="DENUE",
        descripcion="Directorio Estadístico Nacional de Unidades Económicas",
        periodicidad="bienal",
        vigente=True,
        tema_principal="economía",
        fuente_id=inegi.id,
    )
    db.add_all([ds_enoe, ds_conapo_proy, ds_siap_prod, ds_denue])
    await db.flush()

    # Ediciones
    ed_enoe_2023q4 = EdicionDataset(
        nombre="ENOE T4-2023",
        fecha_publicacion=date(2024, 2, 15),
        periodo_referencia_inicio=date(2023, 10, 1),
        periodo_referencia_fin=date(2023, 12, 31),
        tipo_periodo_referencia="trimestral",
        dataset_id=ds_enoe.id,
    )
    ed_conapo_2023 = EdicionDataset(
        nombre="Proyecciones 2023",
        fecha_publicacion=date(2023, 5, 20),
        tipo_periodo_referencia="anual",
        dataset_id=ds_conapo_proy.id,
    )
    ed_siap_2022 = EdicionDataset(
        nombre="Producción 2022 definitiva",
        fecha_publicacion=date(2023, 12, 15),
        tipo_periodo_referencia="anual",
        dataset_id=ds_siap_prod.id,
    )
    ed_denue_2023 = EdicionDataset(
        nombre="DENUE 2023",
        fecha_publicacion=date(2023, 10, 1),
        tipo_periodo_referencia="bienal",
        dataset_id=ds_denue.id,
    )
    db.add_all([ed_enoe_2023q4, ed_conapo_2023, ed_siap_2022, ed_denue_2023])
    await db.flush()

    # Distribuciones
    dist_enoe = Distribucion(
        descriptor="Microdatos ENOE T4-2023",
        url="https://www.inegi.org.mx/programas/enoe/15ymas/",
        edicion_dataset_id=ed_enoe_2023q4.id,
    )
    dist_conapo = Distribucion(
        descriptor="Proyecciones CONAPO portal",
        url="https://www.gob.mx/conapo/documentos/proyecciones-de-la-poblacion",
        edicion_dataset_id=ed_conapo_2023.id,
    )
    dist_siap = Distribucion(
        descriptor="Cifras definitivas SIAP",
        url="https://www.gob.mx/siap/documentos/produccion-agropecuaria",
        edicion_dataset_id=ed_siap_2022.id,
    )
    dist_denue = Distribucion(
        descriptor="Descarga DENUE 2023",
        url="https://www.inegi.org.mx/app/descarga/?ti=6",
        edicion_dataset_id=ed_denue_2023.id,
    )
    db.add_all([dist_enoe, dist_conapo, dist_siap, dist_denue])
    await db.flush()

    # Archivos
    archivos = [
        Archivo(nombre_archivo="microdatos_enoe_t4_2023.csv", distribucion_id=dist_enoe.id, rol_archivo="datos"),
        Archivo(nombre_archivo="cuestionario_enoe_basico.pdf", distribucion_id=dist_enoe.id, rol_archivo="documentacion"),
        Archivo(nombre_archivo="proyecciones_municipales_2020_2050.xlsx", distribucion_id=dist_conapo.id, rol_archivo="datos"),
        Archivo(nombre_archivo="notas_tecnicas_conapo.pdf", distribucion_id=dist_conapo.id, rol_archivo="documentacion"),
        Archivo(nombre_archivo="produccion_agropecuaria_2022.xlsx", distribucion_id=dist_siap.id, rol_archivo="datos"),
        Archivo(nombre_archivo="denue_2023_jalisco.csv", distribucion_id=dist_denue.id, rol_archivo="datos"),
        Archivo(nombre_archivo="documentacion_denue_2023.pdf", distribucion_id=dist_denue.id, rol_archivo="documentacion"),
    ]
    db.add_all(archivos)
    await db.flush()

    # Bases de datos
    bd_enoe = BaseDeDatos(db_nombre="ENOE", meta={"fuente": "INEGI"}, dataset_id=ds_enoe.id)
    bd_conapo = BaseDeDatos(db_nombre="CONAPO", meta={"fuente": "CONAPO"}, dataset_id=ds_conapo_proy.id)
    bd_siap = BaseDeDatos(db_nombre="SIAP", meta={"fuente": "SAGARPA"}, dataset_id=ds_siap_prod.id)
    bd_denue = BaseDeDatos(db_nombre="DENUE", meta={"fuente": "INEGI"}, dataset_id=ds_denue.id)
    db.add_all([bd_enoe, bd_conapo, bd_siap, bd_denue])
    await db.flush()

    # Informacion tablas
    t_ocupacion = InformacionTablas(nombre="01_vista_ocupacion_empleo", base_de_datos_id=bd_enoe.id)
    t_desocupacion = InformacionTablas(nombre="07_vista_tasa_desocupacion", base_de_datos_id=bd_enoe.id)
    t_pob_municipio = InformacionTablas(nombre="02_vista_poblacion_municipio", base_de_datos_id=bd_conapo.id)
    t_superficie = InformacionTablas(nombre="04_vista_superficie_agricola", base_de_datos_id=bd_siap.id)
    t_produccion = InformacionTablas(nombre="05_vista_produccion_cultivos", base_de_datos_id=bd_siap.id)
    t_unidades = InformacionTablas(nombre="06_vista_unidades_economicas", base_de_datos_id=bd_denue.id)
    db.add_all([t_ocupacion, t_desocupacion, t_pob_municipio, t_superficie, t_produccion, t_unidades])
    await db.flush()

    # Proyectos y productos
    mapalab = Proyecto(nombre="MapaLab Jalisco", descripcion="Plataforma de mapas y geovisualización")
    pagina = Proyecto(nombre="Página del Instituto", descripcion="Sitio web oficial del IIEG")
    db.add_all([mapalab, pagina])
    await db.flush()

    p_agricultura = Producto(proyecto_id=mapalab.id, nombre="Capa de Agricultura")
    p_poblacion = Producto(proyecto_id=mapalab.id, nombre="Capa de Población")
    p_economia = Producto(proyecto_id=mapalab.id, nombre="Capa de Economía")
    p_indicadores = Producto(proyecto_id=pagina.id, nombre="Sección de Indicadores")
    db.add_all([p_agricultura, p_poblacion, p_economia, p_indicadores])
    await db.flush()

    # Producto-tabla links
    vinculaciones = [
        ProductoTabla(producto_id=p_economia.id, informacion_tablas_id=t_ocupacion.id),
        ProductoTabla(producto_id=p_economia.id, informacion_tablas_id=t_desocupacion.id),
        ProductoTabla(producto_id=p_economia.id, informacion_tablas_id=t_unidades.id),
        ProductoTabla(producto_id=p_poblacion.id, informacion_tablas_id=t_pob_municipio.id),
        ProductoTabla(producto_id=p_agricultura.id, informacion_tablas_id=t_superficie.id),
        ProductoTabla(producto_id=p_agricultura.id, informacion_tablas_id=t_produccion.id),
        ProductoTabla(producto_id=p_indicadores.id, informacion_tablas_id=t_ocupacion.id),
        ProductoTabla(producto_id=p_indicadores.id, informacion_tablas_id=t_unidades.id),
    ]
    db.add_all(vinculaciones)
    await db.flush()
    logger.info("Catalog seeded.")


async def seed(db: AsyncSession) -> None:
    """Development seed: RBAC + users + catalog data."""
    roles = await seed_rbac(db)
    await db.commit()
    await seed_users(db, roles)
    await seed_catalog(db)
    await db.commit()
    logger.info("Seeding completed successfully.")


def run_migrations() -> None:
    """Execute all SQL migration files in order using psql."""
    migrations_dir = Path(__file__).parent / "migrations"
    env = {
        "PGPASSWORD": settings.POSTGRES_PASSWORD,
        "PATH": "/usr/bin:/bin:/usr/local/bin",
    }
    for migration_file in sorted(migrations_dir.glob("0*.sql")):
        logger.info("Running migration %s...", migration_file.name)
        subprocess.run(
            [
                "psql",
                "-h", settings.POSTGRES_HOST,
                "-p", str(settings.POSTGRES_PORT),
                "-U", settings.POSTGRES_USER,
                "-d", settings.POSTGRES_DB,
                "-f", str(migration_file),
            ],
            env=env,
            check=True,
        )
    logger.info("Migrations completed.")


async def main() -> None:
    run_migrations()
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        await seed(db)
    await engine.dispose()


async def main_prod() -> None:
    run_migrations()
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        await seed_superadmin(db)
    await engine.dispose()


async def main_dev_init() -> None:
    """Migrations + superadmin only, for dev without full seed."""
    run_migrations()
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        await seed_superadmin(db)
    await engine.dispose()


if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "dev"
    if mode == "prod":
        asyncio.run(main_prod())
    elif mode == "dev-init":
        asyncio.run(main_dev_init())
    else:
        asyncio.run(main())
