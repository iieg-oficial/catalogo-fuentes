import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.producto import Producto
from models.proyecto import Proyecto
from services.import_service import (
    ImportBlockedError,
    ImportValidationError,
    import_entity,
)


def _csv_bytes(text: str) -> bytes:
    return text.encode("utf-8")


@pytest.mark.asyncio
async def test_rechaza_formato_no_csv(db_session: AsyncSession):
    with pytest.raises(ImportValidationError) as exc:
        await import_entity("proyecto", b"contenido", "proyectos.xlsx", db_session)
    assert "Formato no soportado: solo se aceptan archivos .csv" in str(exc.value)


@pytest.mark.asyncio
async def test_rechaza_archivo_excede_limite_filas(db_session: AsyncSession):
    filas = "\n".join(f"proyecto{i}" for i in range(5001))
    contenido = _csv_bytes("nombre\n" + filas)
    with pytest.raises(ImportValidationError) as exc:
        await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert "excede el límite de 5000 filas / 5 MB" in str(exc.value)


@pytest.mark.asyncio
async def test_rechaza_archivo_excede_limite_mb(db_session: AsyncSession):
    contenido = _csv_bytes("nombre\n") + b"a" * (5 * 1024 * 1024 + 1)
    with pytest.raises(ImportValidationError) as exc:
        await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert "excede el límite de 5000 filas / 5 MB" in str(exc.value)


@pytest.mark.asyncio
async def test_csv_sin_filas_de_datos_no_devuelve_200_silencioso(db_session: AsyncSession):
    contenido = _csv_bytes("nombre,descripcion\n")
    with pytest.raises(ImportValidationError) as exc:
        await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert "El archivo no contiene filas de datos." in str(exc.value)


@pytest.mark.asyncio
async def test_columna_requerida_faltante_aborta(db_session: AsyncSession):
    contenido = _csv_bytes("descripcion\nsin nombre aqui")
    with pytest.raises(ImportValidationError) as exc:
        await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert "nombre" in str(exc.value)


@pytest.mark.asyncio
async def test_csv_con_bom_utf8_se_importa_correctamente(db_session: AsyncSession):
    contenido = "nombre,descripcion\nProyecto BOM,con BOM al inicio".encode("utf-8-sig")
    result = await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert result.creados == 1
    assert result.omitidos_duplicados == []


@pytest.mark.asyncio
async def test_parseo_exitoso_construye_filas(db_session: AsyncSession):
    contenido = _csv_bytes("nombre,descripcion\nDatos Abiertos,Proyecto de datos abiertos")
    result = await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert result.creados == 1
    assert result.omitidos_duplicados == []


@pytest.mark.asyncio
async def test_import_proyecto_valido_crea_todos_en_una_transaccion(db_session: AsyncSession):
    contenido = _csv_bytes(
        "nombre,descripcion\n"
        "Proyecto Uno,Descripcion 1\n"
        "Proyecto Dos,Descripcion 2\n"
    )
    result = await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert result.entidad == "proyecto"
    assert result.creados == 2
    assert result.omitidos_duplicados == []

    rows = (await db_session.execute(select(Proyecto))).scalars().all()
    assert len(rows) == 2


@pytest.mark.asyncio
async def test_resuelve_fk_producto_proyecto_existente(db_session: AsyncSession):
    proyecto = Proyecto(nombre="Proyecto Padre")
    db_session.add(proyecto)
    await db_session.commit()
    await db_session.refresh(proyecto)

    contenido = _csv_bytes("nombre,proyecto\nProducto A,Proyecto Padre")
    result = await import_entity("producto", contenido, "productos.csv", db_session)
    assert result.creados == 1

    productos = (await db_session.execute(select(Producto))).scalars().all()
    assert len(productos) == 1
    assert productos[0].proyecto_id == proyecto.id


@pytest.mark.asyncio
async def test_import_producto_valido_con_fk_resuelto(db_session: AsyncSession):
    proyecto = Proyecto(nombre="Proyecto X")
    db_session.add(proyecto)
    await db_session.commit()

    contenido = _csv_bytes(
        "nombre,proyecto\n"
        "Producto Uno,Proyecto X\n"
        "Producto Dos,Proyecto X\n"
    )
    result = await import_entity("producto", contenido, "productos.csv", db_session)
    assert result.creados == 2
    assert result.omitidos_duplicados == []


@pytest.mark.asyncio
async def test_fk_padre_inexistente_aborta_con_mensaje_fijo(db_session: AsyncSession):
    contenido = _csv_bytes("nombre,proyecto\nProducto A,Proyecto Fantasma")
    with pytest.raises(ImportBlockedError) as exc:
        await import_entity("producto", contenido, "productos.csv", db_session)
    assert exc.value.fila == 2
    assert exc.value.motivo == "fk_no_resuelta"
    assert exc.value.mensaje == "Fila 2: no se encontró proyecto 'Proyecto Fantasma'"

    productos = (await db_session.execute(select(Producto))).scalars().all()
    assert productos == []


@pytest.mark.asyncio
async def test_ambiguedad_normalizacion_aborta(db_session: AsyncSession):
    db_session.add_all([Proyecto(nombre="Datos"), Proyecto(nombre="datos ")])
    await db_session.commit()

    contenido = _csv_bytes("nombre,proyecto\nProducto A,Datos")
    with pytest.raises(ImportBlockedError) as exc:
        await import_entity("producto", contenido, "productos.csv", db_session)
    assert exc.value.motivo == "ambiguedad"
    assert exc.value.fila is None
    assert exc.value.mensaje.startswith("Ambigüedad en proyecto: ")
    assert exc.value.mensaje.endswith("coincide con más de un registro tras normalizar.")

    productos = (await db_session.execute(select(Producto))).scalars().all()
    assert productos == []


@pytest.mark.asyncio
async def test_fila_duplicada_se_omite_no_bloquea(db_session: AsyncSession):
    existente = Proyecto(nombre="Ya Existe")
    db_session.add(existente)
    await db_session.commit()

    contenido = _csv_bytes("nombre,descripcion\nYa Existe,repetido\nNuevo Proyecto,nuevo")
    result = await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert result.creados == 1
    assert len(result.omitidos_duplicados) == 1
    assert result.omitidos_duplicados[0].motivo == "duplicado"


@pytest.mark.asyncio
async def test_reporta_creados_y_omitidos_duplicados(db_session: AsyncSession):
    contenido = _csv_bytes(
        "nombre,descripcion\n"
        "Proyecto Repetido,uno\n"
        "Proyecto Repetido,dos duplicado en el mismo csv\n"
        "Proyecto Nuevo,tres\n"
    )
    result = await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert result.creados == 2
    assert len(result.omitidos_duplicados) == 1


@pytest.mark.asyncio
async def test_fila_bloqueante_hace_rollback_completo_no_persiste_nada(db_session: AsyncSession):
    contenido = _csv_bytes(
        "nombre,proyecto\n"
        "Producto Valido,Proyecto Inexistente\n"
    )
    with pytest.raises(ImportBlockedError):
        await import_entity("producto", contenido, "productos.csv", db_session)

    productos = (await db_session.execute(select(Producto))).scalars().all()
    assert productos == []


@pytest.mark.asyncio
async def test_campo_requerido_vacio_aborta_con_mensaje_fijo(db_session: AsyncSession):
    contenido = _csv_bytes("nombre,descripcion\n,descripcion sin nombre")
    with pytest.raises(ImportBlockedError) as exc:
        await import_entity("proyecto", contenido, "proyectos.csv", db_session)
    assert exc.value.motivo == "campo_requerido"
    assert "nombre" in exc.value.mensaje
