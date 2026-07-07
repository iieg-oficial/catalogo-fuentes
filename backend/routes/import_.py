import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from exceptions.http import not_found
from import_config import IMPORT_CONFIGS
from routes.dependencies import require_admin
from schemas.import_ import ImportErrorDetail, ImportResult
from services.import_service import (
    LIMITE_MENSAJE,
    MAX_BYTES,
    ImportBlockedError,
    ImportValidationError,
    import_entity,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/import", tags=["import"])

CHUNK_SIZE = 1024 * 1024


async def _leer_archivo_con_limite(file: UploadFile, max_bytes: int) -> bytes:
    """Lee el archivo subido en bloques, cortando apenas se supera el límite.

    Args:
        file: archivo subido por el cliente.
        max_bytes: tamaño máximo permitido en bytes.

    Returns:
        Contenido completo del archivo si no excede el límite.

    Raises:
        ImportValidationError: si el archivo supera max_bytes. No se materializa
            el archivo completo en memoria cuando esto ocurre.
    """
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise ImportValidationError(LIMITE_MENSAJE)
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("/{entidad}", response_model=ImportResult)
async def import_csv(
    entidad: str,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    if entidad not in IMPORT_CONFIGS:
        raise not_found("Entidad")

    filename = file.filename or ""

    try:
        file_bytes = await _leer_archivo_con_limite(file, MAX_BYTES)
        result = await import_entity(entidad, file_bytes, filename, db)
    except ImportValidationError as error:
        detail = ImportErrorDetail(mensaje=error.mensaje).model_dump()
        if "excede el límite" in error.mensaje:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=detail)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    except ImportBlockedError as error:
        detail = ImportErrorDetail(mensaje=error.mensaje, fila=error.fila).model_dump()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

    logger.info("Import de %s completado: %s creados", entidad, result.creados)
    return result
