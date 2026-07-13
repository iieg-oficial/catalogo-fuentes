import uuid
from datetime import datetime

from schemas.distribucion import DistribucionRead
from schemas.refs import DatasetRef, EdicionDatasetRef


def _base_kwargs() -> dict:
    return {
        "id": uuid.uuid4(),
        "created_at": datetime(2024, 1, 1),
    }


def test_label_combina_distribucion_edicion_y_nombre_corto():
    read = DistribucionRead(
        **_base_kwargs(),
        distribucion="Nacional",
        edicion_dataset=EdicionDatasetRef(id=uuid.uuid4(), edicion="2024"),
        dataset=DatasetRef(id=uuid.uuid4(), nombre="Censo de Poblacion", nombre_corto="censo"),
    )
    assert read.distribucion_label == "Nacional · 2024 · censo"


def test_label_omite_partes_faltantes():
    read = DistribucionRead(
        **_base_kwargs(),
        distribucion="Nacional",
        edicion_dataset=None,
        dataset=DatasetRef(id=uuid.uuid4(), nombre="Censo", nombre_corto=None),
    )
    assert read.distribucion_label == "Nacional"


def test_label_fallback_a_id_cuando_todo_vacio():
    read_id = uuid.uuid4()
    read = DistribucionRead(
        id=read_id,
        created_at=datetime(2024, 1, 1),
        distribucion=None,
    )
    assert read.distribucion_label == str(read_id)[:8]
