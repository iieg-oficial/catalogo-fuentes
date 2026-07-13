from typing import Any

from pydantic import BaseModel


class ImportSkipped(BaseModel):
    """Fila omitida por duplicado durante un import CSV."""

    fila: int
    motivo: str  # "duplicado"
    valor: str


class ImportErrorDetail(BaseModel):
    """Detalle uniforme de un bloqueo de import CSV (formato, tamaño o fila)."""

    bloqueado: bool = True
    mensaje: str
    fila: int | None = None


class ImportResult(BaseModel):
    """Resultado exitoso de un import CSV (200)."""

    entidad: str
    creados: int
    omitidos_duplicados: list[ImportSkipped] = []


class ImportPreviewRow(BaseModel):
    """Fila que se crearía en un preview (dry-run) de import CSV.

    `datos` usa un tipo laxo (`dict[str, Any]`) en lugar de reutilizar los
    schemas `*Read` de cada entidad: estos exigen `id`/`created_at`/
    `updated_at` reales, que no existen porque la fila no fue persistida.
    El `id` incluido dentro de `datos` es sintético (`"preview-N"`) y sirve
    solo como key de React en el frontend, nunca se guarda en la base.
    """

    fila: int
    datos: dict[str, Any]


class ImportPreviewResult(BaseModel):
    """Resultado de un preview (dry-run) de import CSV (200), sin persistir."""

    entidad: str
    a_crear: list[ImportPreviewRow]
    omitidos_duplicados: list[ImportSkipped] = []
