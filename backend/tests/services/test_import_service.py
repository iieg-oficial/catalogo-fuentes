import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.dataset import Dataset
from models.distribucion import Distribucion
from models.edicion_dataset import EdicionDataset
from models.fuente import Fuente
from models.informacion_tablas import InformacionTablas
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


# --- fuente ---


@pytest.mark.asyncio
async def test_import_fuente_valido_con_bool_coercion(db_session: AsyncSession):
    contenido = _csv_bytes(
        "nombre,es_fuente_oficial,es_publicador\n"
        "INEGI,true,no\n"
        "IIEG,si,\n"
    )
    result = await import_entity("fuente", contenido, "fuentes.csv", db_session)
    assert result.creados == 2

    fuentes = {f.nombre: f for f in (await db_session.execute(select(Fuente))).scalars().all()}
    assert fuentes["INEGI"].es_fuente_oficial is True
    assert fuentes["INEGI"].es_publicador is False
    assert fuentes["IIEG"].es_fuente_oficial is True
    assert fuentes["IIEG"].es_publicador is False  # celda vacía -> default del schema


@pytest.mark.asyncio
async def test_bool_invalido_bloquea_con_mensaje_claro(db_session: AsyncSession):
    contenido = _csv_bytes("nombre,es_fuente_oficial\nINEGI,tal_vez")
    with pytest.raises(ImportBlockedError) as exc:
        await import_entity("fuente", contenido, "fuentes.csv", db_session)
    assert "valor booleano inválido" in exc.value.mensaje
    assert "es_fuente_oficial" in exc.value.mensaje


# --- dataset ---


@pytest.mark.asyncio
async def test_import_dataset_fk_fuente_opcional_vacia_no_bloquea(db_session: AsyncSession):
    contenido = _csv_bytes("nombre,fuente\nDataset Sin Fuente,")
    result = await import_entity("dataset", contenido, "datasets.csv", db_session)
    assert result.creados == 1

    datasets = (await db_session.execute(select(Dataset))).scalars().all()
    assert datasets[0].fuente_id is None


@pytest.mark.asyncio
async def test_import_dataset_fk_fuente_resuelta(db_session: AsyncSession):
    fuente = Fuente(nombre="INEGI")
    db_session.add(fuente)
    await db_session.commit()
    await db_session.refresh(fuente)

    contenido = _csv_bytes("nombre,fuente\nDataset A,INEGI")
    result = await import_entity("dataset", contenido, "datasets.csv", db_session)
    assert result.creados == 1

    datasets = (await db_session.execute(select(Dataset))).scalars().all()
    assert datasets[0].fuente_id == fuente.id


# --- edicion_dataset ---


@pytest.mark.asyncio
async def test_import_edicion_dataset_dictamen_invalido_bloquea_con_mensaje_claro(
    db_session: AsyncSession,
):
    contenido = _csv_bytes("edicion,dictamen\n2024,Z9")
    with pytest.raises(ImportBlockedError) as exc:
        await import_entity("edicion_dataset", contenido, "ediciones.csv", db_session)
    assert exc.value.motivo == "parseo"
    assert "dictamen" in exc.value.mensaje


@pytest.mark.asyncio
async def test_import_edicion_dataset_fk_dataset_opcional(db_session: AsyncSession):
    contenido = _csv_bytes("edicion,dataset\n2024,")
    result = await import_entity("edicion_dataset", contenido, "ediciones.csv", db_session)
    assert result.creados == 1
    ediciones = (await db_session.execute(select(EdicionDataset))).scalars().all()
    assert ediciones[0].dataset_id is None


# --- distribucion ---


@pytest.mark.asyncio
async def test_import_distribucion_dedup_clave_compuesta(db_session: AsyncSession):
    dataset = Dataset(nombre="Dataset X")
    db_session.add(dataset)
    await db_session.commit()
    await db_session.refresh(dataset)

    contenido = _csv_bytes(
        "distribucion,dataset\n"
        "CSV,Dataset X\n"
        "CSV,Dataset X\n"
    )
    result = await import_entity("distribucion", contenido, "distribuciones.csv", db_session)
    assert result.creados == 1
    assert len(result.omitidos_duplicados) == 1


@pytest.mark.asyncio
async def test_fila_completamente_vacia_se_omite_no_crea_registro(db_session: AsyncSession):
    contenido = _csv_bytes(
        "distribucion,url,dataset\n"
        "CSV,http://a,\n"
        ",,\n"
        "JSON,http://b,\n"
    )
    result = await import_entity("distribucion", contenido, "distribuciones.csv", db_session)
    assert result.creados == 2
    assert result.omitidos_duplicados == []

    filas = (await db_session.execute(select(Distribucion))).scalars().all()
    assert len(filas) == 2


# --- archivo ---


@pytest.mark.asyncio
async def test_import_archivo_rol_archivo_invalido_bloquea_con_mensaje_claro(
    db_session: AsyncSession,
):
    contenido = _csv_bytes("nombre_archivo,rol_archivo\narchivo.csv,rol_inexistente")
    with pytest.raises(ImportBlockedError) as exc:
        await import_entity("archivo", contenido, "archivos.csv", db_session)
    assert exc.value.motivo == "parseo"
    assert "rol_archivo" in exc.value.mensaje


@pytest.mark.asyncio
async def test_import_archivo_fk_distribucion_opcional_no_bloquea(db_session: AsyncSession):
    contenido = _csv_bytes("nombre_archivo,distribucion\narchivo.csv,")
    result = await import_entity("archivo", contenido, "archivos.csv", db_session)
    assert result.creados == 1
    archivos = (await db_session.execute(select(Archivo))).scalars().all()
    assert archivos[0].distribucion_id is None


# --- base_de_datos ---


@pytest.mark.asyncio
async def test_import_base_de_datos_fk_archivo_ambiguedad_bloquea(db_session: AsyncSession):
    db_session.add_all(
        [Archivo(nombre_archivo="Datos"), Archivo(nombre_archivo="datos ")]
    )
    await db_session.commit()

    contenido = _csv_bytes("db_nombre,archivo\nBase X,Datos")
    with pytest.raises(ImportBlockedError) as exc:
        await import_entity("base_de_datos", contenido, "bases.csv", db_session)
    assert exc.value.motivo == "ambiguedad"

    bases = (await db_session.execute(select(BaseDeDatos))).scalars().all()
    assert bases == []


@pytest.mark.asyncio
async def test_import_base_de_datos_valido_sin_fk(db_session: AsyncSession):
    contenido = _csv_bytes("db_nombre\nBase Y")
    result = await import_entity("base_de_datos", contenido, "bases.csv", db_session)
    assert result.creados == 1


# --- informacion_tablas ---


@pytest.mark.asyncio
async def test_import_informacion_tablas_fks_dobles_opcionales_ambas_vacias(
    db_session: AsyncSession,
):
    contenido = _csv_bytes("nombre,base_de_datos,producto\nTabla A,,")
    result = await import_entity(
        "informacion_tablas", contenido, "informacion_tablas.csv", db_session
    )
    assert result.creados == 1
    filas = (await db_session.execute(select(InformacionTablas))).scalars().all()
    assert filas[0].base_de_datos_id is None
    assert filas[0].producto_id is None


@pytest.mark.asyncio
async def test_import_informacion_tablas_fk_producto_resuelta(db_session: AsyncSession):
    proyecto = Proyecto(nombre="Proyecto Padre 2")
    db_session.add(proyecto)
    await db_session.commit()
    await db_session.refresh(proyecto)
    producto = Producto(nombre="Producto Padre", proyecto_id=proyecto.id)
    db_session.add(producto)
    await db_session.commit()
    await db_session.refresh(producto)

    contenido = _csv_bytes("nombre,producto\nTabla B,Producto Padre")
    result = await import_entity(
        "informacion_tablas", contenido, "informacion_tablas.csv", db_session
    )
    assert result.creados == 1
    filas = (await db_session.execute(select(InformacionTablas))).scalars().all()
    assert filas[0].producto_id == producto.id
