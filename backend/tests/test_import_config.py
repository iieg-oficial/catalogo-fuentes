from import_config import IMPORT_CONFIGS
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
