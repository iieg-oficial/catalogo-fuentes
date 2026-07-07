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
