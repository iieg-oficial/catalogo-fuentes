import re
import unicodedata


def normalizar(nombre: str) -> str:
    """Normaliza un nombre para comparación de claves naturales.

    Aplica: minúsculas, recorte de espacios en los extremos, colapso de
    espacios internos múltiples y remoción de acentos/diacríticos (NFKD).
    """
    sin_acentos = "".join(
        char
        for char in unicodedata.normalize("NFKD", nombre)
        if not unicodedata.combining(char)
    )
    minuscula = sin_acentos.lower().strip()
    return re.sub(r"\s+", " ", minuscula)
