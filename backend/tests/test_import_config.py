from import_config import IMPORT_CONFIGS
from models.archivo import Archivo
from models.base_de_datos import BaseDeDatos
from models.dataset import Dataset
from models.distribucion import Distribucion
from models.edicion_dataset import EdicionDataset
from models.fuente import Fuente
from models.informacion_tablas import InformacionTablas
from models.producto import Producto
from models.proyecto import Proyecto


def test_proyecto_config_existe_sin_fk():
    config = IMPORT_CONFIGS["proyecto"]
    assert config.model is Proyecto
    assert config.required_columns == ["nombre"]
    assert config.column_to_field == {"nombre": "nombre", "descripcion": "descripcion"}
    assert config.fks == []
    assert config.natural_key == ["nombre"]


def test_producto_config_existe_con_fk_a_proyecto():
    config = IMPORT_CONFIGS["producto"]
    assert config.model is Producto
    assert config.required_columns == ["nombre", "proyecto"]
    assert config.column_to_field == {"nombre": "nombre", "descripcion": "descripcion"}
    assert len(config.fks) == 1
    fk = config.fks[0]
    assert fk.csv_column == "proyecto"
    assert fk.parent_model is Proyecto
    assert fk.parent_key_field == "nombre"
    assert fk.target_field == "proyecto_id"
    assert config.natural_key == ["nombre", "proyecto_id"]


def test_entidad_desconocida_no_esta_en_configs():
    assert "entidad_inexistente" not in IMPORT_CONFIGS


def test_fuente_config_existe_sin_fk():
    config = IMPORT_CONFIGS["fuente"]
    assert config.model is Fuente
    assert config.required_columns == ["nombre"]
    assert config.fks == []
    assert config.natural_key == ["nombre"]


def test_dataset_config_tiene_fks_opcionales():
    config = IMPORT_CONFIGS["dataset"]
    assert config.model is Dataset
    assert config.required_columns == ["nombre"]
    assert len(config.fks) == 2
    assert all(fk.required is False for fk in config.fks)
    assert config.natural_key == ["nombre", "fuente_id"]


def test_edicion_dataset_config_tiene_fks_opcionales():
    config = IMPORT_CONFIGS["edicion_dataset"]
    assert config.model is EdicionDataset
    assert config.required_columns == ["edicion"]
    assert all(fk.required is False for fk in config.fks)
    assert config.natural_key == ["edicion", "dataset_id"]


def test_distribucion_config_sin_required_columns():
    config = IMPORT_CONFIGS["distribucion"]
    assert config.model is Distribucion
    assert config.required_columns == []
    # dataset y tipo_de_acceso siguen siendo FKs simples; edicion pasa a compuesta.
    assert len(config.fks) == 2
    assert all(fk.required is False for fk in config.fks)
    assert len(config.composite_fks) == 1
    cfk = config.composite_fks[0]
    assert cfk.parent_model is EdicionDataset
    assert cfk.target_field == "edicion_dataset_id"
    assert [parte.csv_column for parte in cfk.parts] == ["edicion", "dataset"]
    assert config.natural_key == ["distribucion", "dataset_id", "edicion_dataset_id"]


def test_archivo_config_fk_distribucion_compuesta():
    config = IMPORT_CONFIGS["archivo"]
    assert config.model is Archivo
    assert config.required_columns == ["nombre_archivo"]
    assert config.fks == []
    assert len(config.composite_fks) == 1
    cfk = config.composite_fks[0]
    assert cfk.parent_model is Distribucion
    assert cfk.target_field == "distribucion_id"
    assert cfk.required is False
    assert [parte.csv_column for parte in cfk.parts] == ["distribucion", "dataset", "edicion"]
    assert config.natural_key == ["nombre_archivo", "distribucion_id"]


def test_base_de_datos_config_fk_archivo_opcional():
    config = IMPORT_CONFIGS["base_de_datos"]
    assert config.model is BaseDeDatos
    assert config.required_columns == ["db_nombre"]
    assert len(config.fks) == 1
    assert config.fks[0].required is False
    assert config.natural_key == ["db_nombre", "archivo_id"]


def test_informacion_tablas_config_fks_dobles_opcionales():
    config = IMPORT_CONFIGS["informacion_tablas"]
    assert config.model is InformacionTablas
    assert config.required_columns == ["nombre"]
    assert len(config.fks) == 2
    assert all(fk.required is False for fk in config.fks)
    assert config.natural_key == ["nombre", "base_de_datos_id", "producto_id"]


def test_producto_fk_proyecto_sigue_siendo_requerida():
    config = IMPORT_CONFIGS["producto"]
    assert config.fks[0].required is True
