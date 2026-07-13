from utils.normalize import normalizar


def test_normaliza_a_minusculas():
    assert normalizar("Datos") == "datos"


def test_recorta_espacios_al_inicio_y_final():
    assert normalizar("  datos  ") == "datos"


def test_colapsa_espacios_multiples_internos():
    assert normalizar("datos    abiertos") == "datos abiertos"


def test_quita_acentos():
    assert normalizar("Información") == "informacion"


def test_string_vacio_devuelve_vacio():
    assert normalizar("") == ""


def test_solo_espacios_devuelve_vacio():
    assert normalizar("   ") == ""


def test_colision_de_strings_distintos_que_normalizan_igual():
    assert normalizar("Datos") == normalizar("datos ")
    assert normalizar("DATOS") == normalizar("  datos")
