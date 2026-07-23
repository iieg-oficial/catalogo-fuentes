import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.dataset import Dataset
from models.distribucion import Distribucion
from models.informacion_tablas import InformacionTablas
from models.producto import Producto
from services import productos as svc


async def _link_dataset_to_producto(
    db: AsyncSession, dataset: Dataset, producto: Producto
) -> None:
    """Wire the full physical chain producto -> ... -> dataset."""
    distribucion = Distribucion(dataset_id=dataset.id)
    db.add(distribucion)
    await db.flush()
    archivo = Archivo(nombre_archivo=f"file-{uuid.uuid4().hex[:6]}", distribucion_id=distribucion.id)
    db.add(archivo)
    await db.flush()
    base = BaseDeDatos(db_nombre=f"db-{uuid.uuid4().hex[:6]}", archivo_id=archivo.id)
    db.add(base)
    await db.flush()
    info = InformacionTablas(
        nombre=f"tbl-{uuid.uuid4().hex[:6]}",
        base_de_datos_id=base.id,
        producto_id=producto.id,
    )
    db.add(info)
    await db.flush()


@pytest.mark.asyncio
async def test_list_producto_datasets_returns_datasets_via_physical_chain(
    db_session: AsyncSession,
):
    producto = Producto(nombre="Producto A")
    db_session.add(producto)
    ds1 = Dataset(nombre="Dataset 1")
    ds2 = Dataset(nombre="Dataset 2")
    db_session.add_all([ds1, ds2])
    await db_session.flush()

    await _link_dataset_to_producto(db_session, ds1, producto)
    await _link_dataset_to_producto(db_session, ds2, producto)
    await db_session.commit()

    datasets = await svc.list_producto_datasets(db_session, producto.id)

    assert {d.nombre for d in datasets} == {"Dataset 1", "Dataset 2"}


@pytest.mark.asyncio
async def test_list_producto_datasets_deduplicates_multiple_paths(
    db_session: AsyncSession,
):
    producto = Producto(nombre="Producto A")
    db_session.add(producto)
    dataset = Dataset(nombre="Dataset shared")
    db_session.add(dataset)
    await db_session.flush()

    # Two independent chains from the same producto to the same dataset.
    await _link_dataset_to_producto(db_session, dataset, producto)
    await _link_dataset_to_producto(db_session, dataset, producto)
    await db_session.commit()

    datasets = await svc.list_producto_datasets(db_session, producto.id)

    assert len(datasets) == 1
    assert datasets[0].nombre == "Dataset shared"


@pytest.mark.asyncio
async def test_dataset_can_feed_multiple_productos(db_session: AsyncSession):
    producto_a = Producto(nombre="Producto A")
    producto_b = Producto(nombre="Producto B")
    db_session.add_all([producto_a, producto_b])
    dataset = Dataset(nombre="Dataset shared")
    db_session.add(dataset)
    await db_session.flush()

    await _link_dataset_to_producto(db_session, dataset, producto_a)
    await _link_dataset_to_producto(db_session, dataset, producto_b)
    await db_session.commit()

    datasets_a = await svc.list_producto_datasets(db_session, producto_a.id)
    datasets_b = await svc.list_producto_datasets(db_session, producto_b.id)

    assert [d.nombre for d in datasets_a] == ["Dataset shared"]
    assert [d.nombre for d in datasets_b] == ["Dataset shared"]


@pytest.mark.asyncio
async def test_list_all_producto_datasets_groups_by_producto(
    db_session: AsyncSession,
):
    producto_a = Producto(nombre="Producto A")
    producto_b = Producto(nombre="Producto B")
    db_session.add_all([producto_a, producto_b])
    ds1 = Dataset(nombre="Dataset 1")
    ds2 = Dataset(nombre="Dataset 2")
    db_session.add_all([ds1, ds2])
    await db_session.flush()

    await _link_dataset_to_producto(db_session, ds1, producto_a)
    await _link_dataset_to_producto(db_session, ds2, producto_a)
    await _link_dataset_to_producto(db_session, ds1, producto_b)
    await db_session.commit()

    grouped = await svc.list_all_producto_datasets(db_session)

    assert {d.nombre for d in grouped[str(producto_a.id)]} == {"Dataset 1", "Dataset 2"}
    assert [d.nombre for d in grouped[str(producto_b.id)]] == ["Dataset 1"]


@pytest.mark.asyncio
async def test_list_producto_datasets_empty_when_chain_incomplete(
    db_session: AsyncSession,
):
    producto = Producto(nombre="Producto A")
    db_session.add(producto)
    await db_session.flush()
    # informacion_tablas without base_de_datos -> chain broken.
    db_session.add(InformacionTablas(nombre="orphan", producto_id=producto.id))
    await db_session.commit()

    datasets = await svc.list_producto_datasets(db_session, producto.id)

    assert datasets == []
