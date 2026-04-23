import asyncio
import logging
from datetime import date
from pathlib import Path

from sqlalchemy import insert as sa_insert, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import models  # noqa: F401
from config import settings
from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.instrumento import Instrumento
from models.producto import Producto
from models.proyecto import Proyecto
from models.tabla import Tabla
from models.tabla_producto import tabla_producto as tp_table
from models.url import Url
from models.user import User, UserRole
from services.auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed(db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
    if result.scalar_one_or_none():
        logger.info("Data already seeded, skipping.")
        return

    logger.info("Seeding database...")

    admin = User(email=settings.ADMIN_EMAIL, hashed_password=hash_password(settings.ADMIN_PASSWORD), role=UserRole.admin)
    maintainer = User(
        email="editor@iieg.gob.mx", hashed_password=hash_password("Editor1234!"), role=UserRole.maintainer
    )
    viewer = User(
        email="consulta@iieg.gob.mx", hashed_password=hash_password("Viewer1234!"), role=UserRole.viewer
    )
    db.add_all([admin, maintainer, viewer])
    await db.flush()

    mapalab = Proyecto(
        nombre="MapaLab Jalisco",
        descripcion="Plataforma de mapas y geovisualización del estado de Jalisco",
        meta={"version": "2.0", "tipo": "geoespacial"},
    )
    pagina = Proyecto(
        nombre="Página del Instituto",
        descripcion="Sitio web oficial del IIEG con estadísticas y publicaciones",
        meta={"version": "3.1", "tipo": "portal"},
    )
    cuadernillos = Proyecto(
        nombre="Cuadernillos Estadísticos",
        descripcion="Publicaciones estadísticas anuales por región y municipio de Jalisco",
        meta={"version": "1.0", "tipo": "publicacion"},
    )
    db.add_all([mapalab, pagina, cuadernillos])
    await db.flush()

    p_agricultura = Producto(
        proyecto_id=mapalab.id,
        nombre="Capa de Agricultura",
        descripcion="Capas geoespaciales de actividad agrícola en Jalisco",
        meta={"formato": "geojson"},
    )
    p_poblacion = Producto(
        proyecto_id=mapalab.id,
        nombre="Capa de Población",
        descripcion="Distribución y densidad poblacional por municipio",
        meta={"formato": "geojson"},
    )
    p_economia = Producto(
        proyecto_id=mapalab.id,
        nombre="Capa de Economía",
        descripcion="Indicadores económicos y unidades productivas georreferenciadas",
        meta={"formato": "geojson"},
    )
    p_indicadores = Producto(
        proyecto_id=pagina.id,
        nombre="Sección de Indicadores",
        descripcion="Tablero de indicadores estadísticos clave del estado",
        meta={"seccion": "indicadores"},
    )
    p_descargas = Producto(
        proyecto_id=pagina.id,
        nombre="Sección de Descargas",
        descripcion="Repositorio de archivos estadísticos descargables",
        meta={"seccion": "descargas"},
    )
    p_municipal = Producto(
        proyecto_id=cuadernillos.id,
        nombre="Cuadernillo Municipal",
        descripcion="Estadísticas detalladas por municipio del estado de Jalisco",
        meta={"periodicidad": "anual"},
    )
    p_regional = Producto(
        proyecto_id=cuadernillos.id,
        nombre="Cuadernillo Regional",
        descripcion="Estadísticas agregadas por región económica de Jalisco",
        meta={"periodicidad": "anual"},
    )
    db.add_all([p_agricultura, p_poblacion, p_economia, p_indicadores, p_descargas, p_municipal, p_regional])
    await db.flush()

    bd_enoe = BaseDeDatos(
        nombre="ENOE",
        descripcion="Encuesta Nacional de Ocupación y Empleo del INEGI",
        tema="empleo",
        frecuencia_actualizacion="trimestral",
        meta={"fuente": "INEGI", "cobertura": "nacional"},
    )
    bd_conapo = BaseDeDatos(
        nombre="CONAPO",
        descripcion="Consejo Nacional de Población — proyecciones e indicadores demográficos",
        tema="demografía",
        frecuencia_actualizacion="anual",
        meta={"fuente": "CONAPO", "cobertura": "nacional"},
    )
    bd_siap = BaseDeDatos(
        nombre="SIAP",
        descripcion="Servicio de Información Agroalimentaria y Pesquera",
        tema="agricultura",
        frecuencia_actualizacion="anual",
        meta={"fuente": "SAGARPA", "cobertura": "nacional"},
    )
    bd_denue = BaseDeDatos(
        nombre="DENUE",
        descripcion="Directorio Estadístico Nacional de Unidades Económicas del INEGI",
        tema="economía",
        frecuencia_actualizacion="bienal",
        meta={"fuente": "INEGI", "cobertura": "nacional"},
    )
    db.add_all([bd_enoe, bd_conapo, bd_siap, bd_denue])
    await db.flush()

    t_ocupacion = Tabla(
        base_de_datos_id=bd_enoe.id,
        nombre="01_vista_ocupacion_empleo",
        campos=[
            {"nombre": "periodo", "tipo": "varchar"},
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "tasa_ocupacion", "tipo": "numeric"},
            {"nombre": "poblacion_ocupada", "tipo": "integer"},
        ],
        meta={"actualizacion": "2024-Q4"},
    )
    t_desocupacion = Tabla(
        base_de_datos_id=bd_enoe.id,
        nombre="07_vista_tasa_desocupacion",
        campos=[
            {"nombre": "periodo", "tipo": "varchar"},
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "tasa_desocupacion", "tipo": "numeric"},
        ],
        meta={"actualizacion": "2024-Q4"},
    )
    t_pob_municipio = Tabla(
        base_de_datos_id=bd_conapo.id,
        nombre="02_vista_poblacion_municipio",
        campos=[
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "anio", "tipo": "integer"},
            {"nombre": "poblacion_total", "tipo": "integer"},
            {"nombre": "hombres", "tipo": "integer"},
            {"nombre": "mujeres", "tipo": "integer"},
        ],
        meta={"anio_base": "2020"},
    )
    t_pob_region = Tabla(
        base_de_datos_id=bd_conapo.id,
        nombre="03_vista_poblacion_region",
        campos=[
            {"nombre": "region_id", "tipo": "integer"},
            {"nombre": "anio", "tipo": "integer"},
            {"nombre": "poblacion_total", "tipo": "integer"},
        ],
        meta={"anio_base": "2020"},
    )
    t_proyecciones = Tabla(
        base_de_datos_id=bd_conapo.id,
        nombre="08_vista_proyecciones_poblacion",
        campos=[
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "anio_proyeccion", "tipo": "integer"},
            {"nombre": "poblacion_estimada", "tipo": "integer"},
        ],
        meta={"horizonte": "2050"},
    )
    t_superficie = Tabla(
        base_de_datos_id=bd_siap.id,
        nombre="04_vista_superficie_agricola",
        campos=[
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "anio", "tipo": "integer"},
            {"nombre": "cultivo", "tipo": "varchar"},
            {"nombre": "superficie_ha", "tipo": "numeric"},
        ],
        meta={"unidad": "hectáreas"},
    )
    t_produccion = Tabla(
        base_de_datos_id=bd_siap.id,
        nombre="05_vista_produccion_cultivos",
        campos=[
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "anio", "tipo": "integer"},
            {"nombre": "cultivo", "tipo": "varchar"},
            {"nombre": "produccion_ton", "tipo": "numeric"},
            {"nombre": "rendimiento_ton_ha", "tipo": "numeric"},
        ],
        meta={"unidad": "toneladas"},
    )
    t_rendimiento = Tabla(
        base_de_datos_id=bd_siap.id,
        nombre="10_vista_rendimiento_agricola",
        campos=[
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "anio", "tipo": "integer"},
            {"nombre": "rendimiento_promedio", "tipo": "numeric"},
        ],
        meta={"unidad": "ton/ha"},
    )
    t_unidades = Tabla(
        base_de_datos_id=bd_denue.id,
        nombre="06_vista_unidades_economicas",
        campos=[
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "sector_scian", "tipo": "varchar"},
            {"nombre": "total_unidades", "tipo": "integer"},
            {"nombre": "personal_ocupado", "tipo": "integer"},
        ],
        meta={"version_denue": "2023"},
    )
    t_directorio = Tabla(
        base_de_datos_id=bd_denue.id,
        nombre="09_vista_directorio_empresas",
        campos=[
            {"nombre": "razon_social", "tipo": "varchar"},
            {"nombre": "municipio_id", "tipo": "integer"},
            {"nombre": "sector_scian", "tipo": "varchar"},
            {"nombre": "estrato_personal", "tipo": "varchar"},
        ],
        meta={"version_denue": "2023"},
    )
    db.add_all([
        t_ocupacion, t_desocupacion, t_pob_municipio, t_pob_region, t_proyecciones,
        t_superficie, t_produccion, t_rendimiento, t_unidades, t_directorio,
    ])
    await db.flush()

    await db.execute(
        sa_insert(tp_table),
        [
            {"tabla_id": t_ocupacion.id, "producto_id": p_economia.id},
            {"tabla_id": t_ocupacion.id, "producto_id": p_indicadores.id},
            {"tabla_id": t_desocupacion.id, "producto_id": p_economia.id},
            {"tabla_id": t_desocupacion.id, "producto_id": p_indicadores.id},
            {"tabla_id": t_pob_municipio.id, "producto_id": p_poblacion.id},
            {"tabla_id": t_pob_municipio.id, "producto_id": p_municipal.id},
            {"tabla_id": t_pob_region.id, "producto_id": p_poblacion.id},
            {"tabla_id": t_pob_region.id, "producto_id": p_regional.id},
            {"tabla_id": t_proyecciones.id, "producto_id": p_poblacion.id},
            {"tabla_id": t_superficie.id, "producto_id": p_agricultura.id},
            {"tabla_id": t_superficie.id, "producto_id": p_descargas.id},
            {"tabla_id": t_produccion.id, "producto_id": p_agricultura.id},
            {"tabla_id": t_rendimiento.id, "producto_id": p_agricultura.id},
            {"tabla_id": t_rendimiento.id, "producto_id": p_regional.id},
            {"tabla_id": t_unidades.id, "producto_id": p_economia.id},
            {"tabla_id": t_unidades.id, "producto_id": p_indicadores.id},
            {"tabla_id": t_directorio.id, "producto_id": p_descargas.id},
        ],
    )
    await db.flush()

    i_enoe_cuest = Instrumento(
        base_de_datos_id=bd_enoe.id,
        nombre="ENOE Cuestionario Básico",
        descripcion="Cuestionario principal de la Encuesta Nacional de Ocupación y Empleo",
        fecha_publicacion=date(2023, 3, 15),
        meta={"tipo": "cuestionario", "version": "2023"},
    )
    i_enoe_marco = Instrumento(
        base_de_datos_id=bd_enoe.id,
        nombre="ENOE Marco de Muestreo",
        descripcion="Marco maestro de muestreo para la selección de viviendas ENOE",
        fecha_publicacion=date(2022, 7, 1),
        meta={"tipo": "metodologia"},
    )
    i_conapo_proy = Instrumento(
        base_de_datos_id=bd_conapo.id,
        nombre="Proyecciones de Población 2020-2050",
        descripcion="Series de proyecciones de población a nivel municipal 2020-2050",
        fecha_publicacion=date(2023, 5, 20),
        meta={"periodo": "2020-2050"},
    )
    i_conapo_ind = Instrumento(
        base_de_datos_id=bd_conapo.id,
        nombre="Indicadores Demográficos",
        descripcion="Indicadores de natalidad, mortalidad, migración y crecimiento natural",
        fecha_publicacion=date(2023, 8, 10),
        meta={"tipo": "indicadores"},
    )
    i_siap_avance = Instrumento(
        base_de_datos_id=bd_siap.id,
        nombre="Avance de Siembras y Cosechas",
        descripcion="Reporte mensual de avance agrícola por cultivo y municipio",
        fecha_publicacion=date(2024, 1, 31),
        meta={"frecuencia": "mensual"},
    )
    i_siap_prod = Instrumento(
        base_de_datos_id=bd_siap.id,
        nombre="Producción Agropecuaria",
        descripcion="Cifras definitivas de producción agrícola y pecuaria anual",
        fecha_publicacion=date(2023, 12, 15),
        meta={"frecuencia": "anual"},
    )
    i_denue_2023 = Instrumento(
        base_de_datos_id=bd_denue.id,
        nombre="DENUE 2023",
        descripcion="Directorio actualizado de unidades económicas activas en México",
        fecha_publicacion=date(2023, 10, 1),
        meta={"version": "2023", "unidades": "5.5M"},
    )
    i_denue_inter = Instrumento(
        base_de_datos_id=bd_denue.id,
        nombre="DENUE Interactivo",
        descripcion="Herramienta en línea para consulta georreferenciada del DENUE",
        fecha_publicacion=date(2024, 2, 14),
        meta={"tipo": "aplicacion_web"},
    )
    db.add_all([
        i_enoe_cuest, i_enoe_marco, i_conapo_proy, i_conapo_ind,
        i_siap_avance, i_siap_prod, i_denue_2023, i_denue_inter,
    ])
    await db.flush()

    urls_data = [
        Url(instrumento_id=i_enoe_cuest.id, url="https://www.inegi.org.mx/contenidos/programas/enoe/15ymas/doc/cuest_basico_enoe.pdf", meta={"tipo": "pdf"}),
        Url(instrumento_id=i_enoe_cuest.id, url="https://www.inegi.org.mx/programas/enoe/15ymas/", meta={"tipo": "portal"}),
        Url(instrumento_id=i_enoe_marco.id, url="https://www.inegi.org.mx/contenidos/programas/enoe/15ymas/doc/marco_muestral_enoe.pdf", meta={"tipo": "pdf"}),
        Url(instrumento_id=i_conapo_proy.id, url="https://www.gob.mx/conapo/documentos/proyecciones-de-la-poblacion-de-mexico-y-de-las-entidades-federativas-2016-2050", meta={"tipo": "portal"}),
        Url(instrumento_id=i_conapo_proy.id, url="https://datos.gob.mx/busca/dataset/proyecciones-de-la-poblacion-de-mexico-y-de-las-entidades-federativas", meta={"tipo": "dataset"}),
        Url(instrumento_id=i_conapo_ind.id, url="https://www.gob.mx/conapo/documentos/indicadores-demograficos-basicos-1950-2050", meta={"tipo": "portal"}),
        Url(instrumento_id=i_siap_avance.id, url="https://www.gob.mx/siap/documentos/avance-de-siembras-y-cosechas-resumen-nacional", meta={"tipo": "portal"}),
        Url(instrumento_id=i_siap_avance.id, url="https://nube.siap.gob.mx/avance_agricola/", meta={"tipo": "aplicacion"}),
        Url(instrumento_id=i_siap_prod.id, url="https://www.gob.mx/siap/documentos/produccion-agropecuaria-cifras-definitivas", meta={"tipo": "portal"}),
        Url(instrumento_id=i_denue_2023.id, url="https://www.inegi.org.mx/app/descarga/?ti=6", meta={"tipo": "descarga"}),
        Url(instrumento_id=i_denue_2023.id, url="https://www.inegi.org.mx/programas/denue/", meta={"tipo": "portal"}),
        Url(instrumento_id=i_denue_inter.id, url="https://www.inegi.org.mx/app/mapa/denue/default.aspx", meta={"tipo": "aplicacion"}),
    ]
    db.add_all(urls_data)
    await db.flush()

    archivos_data = [
        Archivo(url_id=urls_data[0].id, descripcion="Cuestionario ENOE básico 2023 formato PDF", fecha_publicacion=date(2023, 3, 15), fecha_fuente="INEGI 2023", meta={"formato": "PDF", "paginas": 48}),
        Archivo(url_id=urls_data[0].id, descripcion="Instructivo de llenado del cuestionario ENOE", fecha_publicacion=date(2023, 3, 15), fecha_fuente="INEGI 2023", meta={"formato": "PDF", "paginas": 120}),
        Archivo(url_id=urls_data[1].id, descripcion="Microdatos ENOE T4 2023 — personas", fecha_publicacion=date(2024, 2, 15), fecha_fuente="INEGI T4-2023", meta={"formato": "CSV", "filas": 450000}),
        Archivo(url_id=urls_data[2].id, descripcion="Marco de muestreo ENOE — documento metodológico", fecha_publicacion=date(2022, 7, 1), fecha_fuente="INEGI 2022", meta={"formato": "PDF"}),
        Archivo(url_id=urls_data[2].id, descripcion="Cartografía de áreas de muestreo ENOE Jalisco", fecha_publicacion=date(2022, 7, 1), fecha_fuente="INEGI 2022", meta={"formato": "Shapefile"}),
        Archivo(url_id=urls_data[3].id, descripcion="Proyecciones de población municipal 2020-2050", fecha_publicacion=date(2023, 5, 20), fecha_fuente="CONAPO 2023", meta={"formato": "XLSX", "hojas": 5}),
        Archivo(url_id=urls_data[3].id, descripcion="Notas técnicas de la metodología de proyecciones", fecha_publicacion=date(2023, 5, 20), fecha_fuente="CONAPO 2023", meta={"formato": "PDF"}),
        Archivo(url_id=urls_data[4].id, descripcion="Dataset abierto de proyecciones CONAPO formato CSV", fecha_publicacion=date(2023, 6, 1), fecha_fuente="CONAPO 2023", meta={"formato": "CSV", "filas": 98000}),
        Archivo(url_id=urls_data[5].id, descripcion="Indicadores demográficos básicos 1950-2050 CONAPO", fecha_publicacion=date(2023, 8, 10), fecha_fuente="CONAPO 2023", meta={"formato": "XLSX"}),
        Archivo(url_id=urls_data[5].id, descripcion="Glosario de indicadores demográficos", fecha_publicacion=date(2023, 8, 10), fecha_fuente="CONAPO 2023", meta={"formato": "PDF"}),
        Archivo(url_id=urls_data[6].id, descripcion="Reporte avance siembras noviembre 2023 nacional", fecha_publicacion=date(2023, 12, 10), fecha_fuente="SIAP Nov-2023", meta={"formato": "PDF"}),
        Archivo(url_id=urls_data[6].id, descripcion="Resumen avance siembras 2023 por estado en Excel", fecha_publicacion=date(2023, 12, 10), fecha_fuente="SIAP 2023", meta={"formato": "XLSX"}),
        Archivo(url_id=urls_data[7].id, descripcion="Base de datos avance agrícola Jalisco 2023", fecha_publicacion=date(2024, 1, 20), fecha_fuente="SIAP 2023", meta={"formato": "CSV", "municipios": 125}),
        Archivo(url_id=urls_data[8].id, descripcion="Producción agropecuaria definitiva 2022", fecha_publicacion=date(2023, 12, 15), fecha_fuente="SIAP 2022", meta={"formato": "XLSX"}),
        Archivo(url_id=urls_data[8].id, descripcion="Series históricas de producción agropecuaria 2010-2022", fecha_publicacion=date(2023, 12, 15), fecha_fuente="SIAP 2010-2022", meta={"formato": "CSV"}),
        Archivo(url_id=urls_data[9].id, descripcion="DENUE 2023 CSV — Jalisco completo", fecha_publicacion=date(2023, 10, 1), fecha_fuente="INEGI DENUE 2023", meta={"formato": "CSV", "unidades": 180000}),
        Archivo(url_id=urls_data[9].id, descripcion="DENUE 2023 XLSX — municipios ZMG", fecha_publicacion=date(2023, 10, 1), fecha_fuente="INEGI DENUE 2023", meta={"formato": "XLSX"}),
        Archivo(url_id=urls_data[10].id, descripcion="Documentación técnica del DENUE 2023", fecha_publicacion=date(2023, 10, 15), fecha_fuente="INEGI 2023", meta={"formato": "PDF"}),
        Archivo(url_id=urls_data[11].id, descripcion="Manual de usuario DENUE Interactivo", fecha_publicacion=date(2024, 2, 14), fecha_fuente="INEGI 2024", meta={"formato": "PDF"}),
        Archivo(url_id=urls_data[11].id, descripcion="Ficha técnica aplicación DENUE Interactivo", fecha_publicacion=date(2024, 2, 14), fecha_fuente="INEGI 2024", meta={"formato": "PDF"}),
    ]
    db.add_all(archivos_data)
    await db.commit()
    logger.info("Seeding completed successfully.")


async def run_migrations(engine: object) -> None:
    """Execute all SQL migration files in order."""
    migrations_dir = Path(__file__).parent / "migrations"
    migration_files = sorted(migrations_dir.glob("0*.sql"))
    async with engine.begin() as conn:
        for migration_file in migration_files:
            logger.info("Running migration %s...", migration_file.name)
            sql = migration_file.read_text(encoding="utf-8")
            await conn.execute(text(sql))
    logger.info("Migrations completed.")


async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    await run_migrations(engine)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        await seed(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
