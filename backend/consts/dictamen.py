# Catálogo de dictamen para ediciones de dataset.
# Lista cerrada y fija: códigos A1..C con su descripción institucional.

DICTAMEN_DESCRIPCIONES: dict[str, str] = {
    "A1": "Apta para uso institucional pleno",
    "A2": "Apta para uso institucional pleno, con nota aclaratoria obligatoria",
    "A3": "Apta para uso institucional pleno, con pendientes de gestión documental o aclaratoria",
    "A4": "Apta para uso institucional pleno, con alto requerimiento laboral",
    "B": "Apta para uso específico, colaboración o análisis técnico controlado",
    "C": "No apta para uso institucional",
}

# Valores válidos, usados para el CHECK constraint y validación.
DICTAMEN_VALUES: list[str] = list(DICTAMEN_DESCRIPCIONES.keys())
