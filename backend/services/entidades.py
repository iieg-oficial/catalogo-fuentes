import logging
import tempfile
from pathlib import Path

from sqlalchemy_erd import Filters, generate_erd
from sqlalchemy_erd.theme import get_theme

import models  # noqa: F401 — registra todos los modelos en Base.metadata
from db import Base

logger = logging.getLogger(__name__)

# Azul de marca del sidebar (brand-600), usado como tema del diagrama.
BRAND_THEME = "#2e4372"

# Entidades principales del catálogo (se omiten tablas de lookup, auth, etc.).
INCLUDED_TABLES = [
    "proyecto",
    "producto",
    "informacion_tablas",
    "base_de_datos",
    "archivo",
    "distribucion",
    "fuente",
    "dataset",
    "edicion_dataset",
]
# Un patrón anclado por tabla (la librería ya ancla el final con \Z).
_INCLUDE_PATTERNS = [rf"\A{table}" for table in INCLUDED_TABLES]

# La metadata es estática en runtime, así que el HTML se genera una sola vez.
_cached_html: str | None = None


def generate_entidades_erd_html() -> str:
    """Genera el ERD interactivo de las entidades desde los modelos SQLAlchemy.

    Lee Base.metadata en vivo, por lo que el diagrama siempre refleja los
    modelos actuales. El resultado se cachea en memoria tras la primera
    generación.

    Returns:
        str: HTML self-contained del diagrama de entidades.
    """
    global _cached_html
    if _cached_html is not None:
        return _cached_html

    # El tema hex solo colorea el header; la PK usa kind_colors["pk"], que
    # se sobreescribe para que también quede en el azul del sidebar.
    theme = get_theme(BRAND_THEME)
    theme.kind_colors["pk"] = BRAND_THEME

    with tempfile.TemporaryDirectory() as tmp:
        output = Path(tmp) / "erd.html"
        generate_erd(
            Base,
            output=str(output),
            format="html",
            theme=theme,
            title="",  # el título lo provee el Topbar de la app; se evita duplicarlo
            filters=Filters(include_tables=_INCLUDE_PATTERNS),
        )
        html = output.read_text(encoding="utf-8")

    # Se oculta el toolbar interno; los controles se reubican en el Topbar de
    # la app para alinearlos con el título de la sección.
    _cached_html = html.replace(
        "</head>", "<style>.toolbar{display:none!important}</style></head>", 1
    )

    logger.info("ERD de entidades generado y cacheado")
    return _cached_html
