import asyncio
import logging
from datetime import date
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import models  # noqa: F401
from config import settings
from consts.roles import ADMIN, MAINTAINER, SUPERADMIN, VIEWER
from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.dataset import Dataset
from models.distribucion import Distribucion
from models.edicion_dataset import EdicionDataset
from models.fuente import Fuente
from models.informacion_tablas import InformacionTablas
from models.medio_distribucion import MedioDistribucion
from models.permiso import Permiso
from models.permiso_rol import PermisoRol
from models.producto import Producto
from models.proyecto import Proyecto
from models.rol import Rol
from models.tipo_dataset import TipoDataset
from models.tipo_de_acceso import TipoDeAcceso
from models.tipo_periodo import TipoPeriodo
from models.usuario import Usuario
from services.auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TIPOS_DATASET = [
    "encuesta",
    "censo",
    "registro administrativo",
    "índice",
    "sistema de consulta",
    "inventario",
    "directorio",
]
TIPOS_DE_ACCESO = ["descarga", "API", "GeoServer"]
MEDIOS_DISTRIBUCION = ["portal web", "portal de datos abiertos", "solicitud directa"]


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
    rol_viewer = Rol(nombre=VIEWER, descripcion="Solo lectura")
    db.add_all([rol_superadmin, rol_admin, rol_maintainer, rol_viewer])
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
    ]
    db.add_all(links)
    await db.flush()
    logger.info("RBAC seeded.")

    return {
        SUPERADMIN: rol_superadmin,
        ADMIN: rol_admin,
        MAINTAINER: rol_maintainer,
        VIEWER: rol_viewer,
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
    viewer = Usuario(
        correo="consulta@iieg.gob.mx",
        nombre="Consulta",
        hashed_password=hash_password("Viewer1234!"),
        rol_id=roles[VIEWER].id,
    )
    db.add_all([superadmin, admin, maintainer, viewer])
    await db.flush()
    logger.info("Users seeded.")


async def seed_catalogos(db: AsyncSession) -> dict[str, dict[str, object]]:
    """Seed normalized catalogs: tipo_dataset, tipo_de_acceso, medio_distribucion, tipo_periodo."""
    result = await db.execute(select(TipoDataset))
    if result.scalars().first():
        logger.info("Catalogs already seeded, fetching existing.")
        tipos_dataset = {t.nombre: t for t in (await db.execute(select(TipoDataset))).scalars().all()}
        tipos_acceso = {t.nombre: t for t in (await db.execute(select(TipoDeAcceso))).scalars().all()}
        medios = {m.nombre: m for m in (await db.execute(select(MedioDistribucion))).scalars().all()}
        tipos_periodo = {t.nombre: t for t in (await db.execute(select(TipoPeriodo))).scalars().all()}
        return {
            "tipo_dataset": tipos_dataset,
            "tipo_de_acceso": tipos_acceso,
            "medio_distribucion": medios,
            "tipo_periodo": tipos_periodo,
        }

    logger.info("Seeding catalogs...")
    tipos_dataset = {nombre: TipoDataset(nombre=nombre) for nombre in TIPOS_DATASET}
    tipos_acceso = {nombre: TipoDeAcceso(nombre=nombre) for nombre in TIPOS_DE_ACCESO}
    medios = {nombre: MedioDistribucion(nombre=nombre) for nombre in MEDIOS_DISTRIBUCION}
    db.add_all([*tipos_dataset.values(), *tipos_acceso.values(), *medios.values()])
    await db.flush()
    # tipo_periodo es enumeración fija sembrada por la migración; solo se consulta.
    tipos_periodo = {t.nombre: t for t in (await db.execute(select(TipoPeriodo))).scalars().all()}
    logger.info("Catalogs seeded.")
    return {
        "tipo_dataset": tipos_dataset,
        "tipo_de_acceso": tipos_acceso,
        "medio_distribucion": medios,
        "tipo_periodo": tipos_periodo,
    }


async def seed_catalog(db: AsyncSession) -> None:
    """Development seed: creates dummy catalog data for testing."""
    catalogos = await seed_catalogos(db)

    result = await db.execute(select(Fuente))
    if result.scalars().first():
        logger.info("Catalog already seeded, skipping.")
        return

    logger.info("Seeding catalog...")

    tipos_dataset = catalogos["tipo_dataset"]
    tipos_acceso = catalogos["tipo_de_acceso"]
    medios = catalogos["medio_distribucion"]
    tipos_periodo = catalogos["tipo_periodo"]

    # Fuentes
    inegi = Fuente(
        nombre="INEGI",
        nombre_corto="INEGI",
        sector="publico",
        ambito="federal",
        descripcion="Instituto Nacional de Estadística y Geografía",
        es_fuente_oficial=True,
        es_publicador=True,
    )
    conapo = Fuente(
        nombre="CONAPO",
        nombre_corto="CONAPO",
        sector="publico",
        ambito="federal",
        descripcion="Consejo Nacional de Población",
        es_fuente_oficial=True,
        es_publicador=True,
    )
    siap = Fuente(
        nombre="SIAP",
        nombre_corto="SIAP",
        sector="publico",
        ambito="federal",
        descripcion="Servicio de Información Agroalimentaria y Pesquera",
        es_fuente_oficial=True,
        es_publicador=True,
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
        fuente_id=inegi.id,
        tipo_dataset_id=tipos_dataset["encuesta"].id,
        etiquetas={"temas": ["empleo"]},
    )
    ds_conapo_proy = Dataset(
        nombre="Proyecciones de Población",
        nombre_corto="CONAPO-PROY",
        descripcion="Proyecciones de la población de México y entidades federativas 2020-2050",
        periodicidad="anual",
        vigente=True,
        fuente_id=conapo.id,
        tipo_dataset_id=tipos_dataset["registro administrativo"].id,
        etiquetas={"temas": ["demografía"]},
    )
    ds_siap_prod = Dataset(
        nombre="Producción Agropecuaria",
        nombre_corto="SIAP-PROD",
        descripcion="Cifras de producción agrícola y pecuaria por municipio",
        periodicidad="anual",
        vigente=True,
        fuente_id=siap.id,
        tipo_dataset_id=tipos_dataset["registro administrativo"].id,
        etiquetas={"temas": ["agricultura"]},
    )
    ds_denue = Dataset(
        nombre="DENUE",
        nombre_corto="DENUE",
        descripcion="Directorio Estadístico Nacional de Unidades Económicas",
        periodicidad="bienal",
        vigente=True,
        fuente_id=inegi.id,
        tipo_dataset_id=tipos_dataset["directorio"].id,
        etiquetas={"temas": ["economía"]},
    )
    db.add_all([ds_enoe, ds_conapo_proy, ds_siap_prod, ds_denue])
    await db.flush()

    # Ediciones
    ed_enoe_2023q4 = EdicionDataset(
        edicion="ENOE T4-2023",
        fecha_publicacion=date(2024, 2, 15),
        periodo_referencia_inicio=date(2023, 10, 1),
        periodo_referencia_fin=date(2023, 12, 31),
        tipo_periodo_id=tipos_periodo["rango"].id,
        dataset_id=ds_enoe.id,
    )
    ed_conapo_2023 = EdicionDataset(
        edicion="Proyecciones 2023",
        fecha_publicacion=date(2023, 5, 20),
        tipo_periodo_id=tipos_periodo["corte"].id,
        dataset_id=ds_conapo_proy.id,
    )
    ed_siap_2022 = EdicionDataset(
        edicion="Producción 2022 definitiva",
        fecha_publicacion=date(2023, 12, 15),
        tipo_periodo_id=tipos_periodo["corte"].id,
        dataset_id=ds_siap_prod.id,
    )
    ed_denue_2023 = EdicionDataset(
        edicion="DENUE 2023",
        fecha_publicacion=date(2023, 10, 1),
        tipo_periodo_id=tipos_periodo["corte"].id,
        dataset_id=ds_denue.id,
    )
    db.add_all([ed_enoe_2023q4, ed_conapo_2023, ed_siap_2022, ed_denue_2023])
    await db.flush()

    # Distribuciones
    dist_enoe = Distribucion(
        distribucion="Microdatos ENOE T4-2023",
        url="https://www.inegi.org.mx/programas/enoe/15ymas/",
        edicion_dataset_id=ed_enoe_2023q4.id,
        dataset_id=ds_enoe.id,
        tipo_de_acceso_id=tipos_acceso["descarga"].id,
        medio_distribucion_id=medios["portal web"].id,
    )
    dist_conapo = Distribucion(
        distribucion="Proyecciones CONAPO portal",
        url="https://www.gob.mx/conapo/documentos/proyecciones-de-la-poblacion",
        edicion_dataset_id=ed_conapo_2023.id,
        dataset_id=ds_conapo_proy.id,
        tipo_de_acceso_id=tipos_acceso["descarga"].id,
        medio_distribucion_id=medios["portal de datos abiertos"].id,
    )
    dist_siap = Distribucion(
        distribucion="Cifras definitivas SIAP",
        url="https://www.gob.mx/siap/documentos/produccion-agropecuaria",
        edicion_dataset_id=ed_siap_2022.id,
        dataset_id=ds_siap_prod.id,
        tipo_de_acceso_id=tipos_acceso["descarga"].id,
        medio_distribucion_id=medios["portal web"].id,
    )
    dist_denue = Distribucion(
        distribucion="Descarga DENUE 2023",
        url="https://www.inegi.org.mx/app/descarga/?ti=6",
        edicion_dataset_id=ed_denue_2023.id,
        dataset_id=ds_denue.id,
        tipo_de_acceso_id=tipos_acceso["API"].id,
        medio_distribucion_id=medios["portal de datos abiertos"].id,
    )
    db.add_all([dist_enoe, dist_conapo, dist_siap, dist_denue])
    await db.flush()

    # Archivos
    arch_enoe_datos = Archivo(nombre_archivo="microdatos_enoe_t4_2023.csv", distribucion_id=dist_enoe.id, rol_archivo="datos")
    arch_enoe_doc = Archivo(nombre_archivo="cuestionario_enoe_basico.pdf", distribucion_id=dist_enoe.id, rol_archivo="documentacion")
    arch_conapo_datos = Archivo(nombre_archivo="proyecciones_municipales_2020_2050.xlsx", distribucion_id=dist_conapo.id, rol_archivo="datos")
    arch_conapo_doc = Archivo(nombre_archivo="notas_tecnicas_conapo.pdf", distribucion_id=dist_conapo.id, rol_archivo="documentacion")
    arch_siap_datos = Archivo(nombre_archivo="produccion_agropecuaria_2022.xlsx", distribucion_id=dist_siap.id, rol_archivo="datos")
    arch_denue_datos = Archivo(nombre_archivo="denue_2023_jalisco.csv", distribucion_id=dist_denue.id, rol_archivo="datos")
    arch_denue_doc = Archivo(nombre_archivo="documentacion_denue_2023.pdf", distribucion_id=dist_denue.id, rol_archivo="documentacion")
    db.add_all([
        arch_enoe_datos, arch_enoe_doc, arch_conapo_datos, arch_conapo_doc,
        arch_siap_datos, arch_denue_datos, arch_denue_doc,
    ])
    await db.flush()

    # Bases de datos (vinculadas al archivo de datos correspondiente)
    bd_enoe = BaseDeDatos(db_nombre="ENOE", etiquetas={"fuente": "INEGI"}, archivo_id=arch_enoe_datos.id)
    bd_conapo = BaseDeDatos(db_nombre="CONAPO", etiquetas={"fuente": "CONAPO"}, archivo_id=arch_conapo_datos.id)
    bd_siap = BaseDeDatos(db_nombre="SIAP", etiquetas={"fuente": "SAGARPA"}, archivo_id=arch_siap_datos.id)
    bd_denue = BaseDeDatos(db_nombre="DENUE", etiquetas={"fuente": "INEGI"}, archivo_id=arch_denue_datos.id)
    db.add_all([bd_enoe, bd_conapo, bd_siap, bd_denue])
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

    # Informacion tablas (FK directa a producto)
    tablas = [
        InformacionTablas(nombre="01_vista_ocupacion_empleo", base_de_datos_id=bd_enoe.id, producto_id=p_economia.id),
        InformacionTablas(nombre="07_vista_tasa_desocupacion", base_de_datos_id=bd_enoe.id, producto_id=p_economia.id),
        InformacionTablas(nombre="02_vista_poblacion_municipio", base_de_datos_id=bd_conapo.id, producto_id=p_poblacion.id),
        InformacionTablas(nombre="04_vista_superficie_agricola", base_de_datos_id=bd_siap.id, producto_id=p_agricultura.id),
        InformacionTablas(nombre="05_vista_produccion_cultivos", base_de_datos_id=bd_siap.id, producto_id=p_agricultura.id),
        InformacionTablas(nombre="06_vista_unidades_economicas", base_de_datos_id=bd_denue.id, producto_id=p_indicadores.id),
    ]
    db.add_all(tablas)
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
    """Apply pending Alembic migrations."""
    alembic_cfg = Config(str(Path(__file__).parent / "alembic.ini"))
    command.upgrade(alembic_cfg, "head")
    logger.info("Migrations completed.")


async def _seed_dev() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        await seed(db)
    await engine.dispose()


async def _seed_superadmin() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        await seed_superadmin(db)
    await engine.dispose()


if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "dev"
    run_migrations()
    if mode == "prod":
        asyncio.run(_seed_superadmin())
    elif mode == "dev-init":
        asyncio.run(_seed_superadmin())
    else:
        asyncio.run(_seed_dev())
