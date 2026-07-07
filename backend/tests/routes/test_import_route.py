import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models.proyecto import Proyecto
from routes.import_ import _leer_archivo_con_limite
from services.import_service import ImportValidationError


def _csv_file(nombre_archivo: str, contenido: str) -> dict:
    return {"file": (nombre_archivo, contenido.encode("utf-8"), "text/csv")}


@pytest.mark.asyncio
async def test_import_exitoso_devuelve_200_con_creados(app_client: AsyncClient, admin_token: str):
    files = _csv_file("proyectos.csv", "nombre,descripcion\nProyecto A,desc")
    response = await app_client.post(
        "/import/proyecto",
        files=files,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["entidad"] == "proyecto"
    assert body["creados"] == 1
    assert body["omitidos_duplicados"] == []


@pytest.mark.asyncio
async def test_entidad_desconocida_devuelve_404(app_client: AsyncClient, admin_token: str):
    files = _csv_file("data.csv", "nombre\nX")
    response = await app_client.post(
        "/import/entidad_inexistente",
        files=files,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_usuario_sin_permiso_devuelve_403(app_client: AsyncClient, maintainer_token: str):
    files = _csv_file("proyectos.csv", "nombre\nProyecto A")
    response = await app_client.post(
        "/import/proyecto",
        files=files,
        headers={"Authorization": f"Bearer {maintainer_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_bloqueo_devuelve_422_con_detalle(
    app_client: AsyncClient, admin_token: str, db_session: AsyncSession
):
    files = _csv_file("productos.csv", "nombre,proyecto\nProducto A,Proyecto Fantasma")
    response = await app_client.post(
        "/import/producto",
        files=files,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["bloqueado"] is True
    assert detail["fila"] == 2
    assert "no se encontró proyecto 'Proyecto Fantasma'" in detail["mensaje"]


@pytest.mark.asyncio
async def test_formato_invalido_devuelve_400(app_client: AsyncClient, admin_token: str):
    files = {"file": ("proyectos.xlsx", b"contenido binario", "application/vnd.ms-excel")}
    response = await app_client.post(
        "/import/proyecto",
        files=files,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["bloqueado"] is True
    assert "Formato no soportado" in detail["mensaje"]
    assert detail["fila"] is None


class _StubUploadFile:
    """Simula un UploadFile que entrega bytes en bloques, para verificar corte temprano."""

    def __init__(self, chunks: list[bytes]):
        self._chunks = list(chunks)
        self.calls = 0

    async def read(self, size: int) -> bytes:
        self.calls += 1
        if not self._chunks:
            return b""
        return self._chunks.pop(0)


@pytest.mark.asyncio
async def test_leer_archivo_con_limite_corta_sin_materializar_todo_el_archivo():
    total_chunks = 20
    chunk = b"a" * (1024 * 1024)
    stub = _StubUploadFile([chunk] * total_chunks)

    with pytest.raises(ImportValidationError) as exc:
        await _leer_archivo_con_limite(stub, max_bytes=5 * 1024 * 1024)

    assert "excede el límite" in exc.value.mensaje
    assert stub.calls < total_chunks


@pytest.mark.asyncio
async def test_excede_limite_devuelve_413(app_client: AsyncClient, admin_token: str):
    contenido = "nombre\n" + "a" * (5 * 1024 * 1024 + 1)
    files = _csv_file("proyectos.csv", contenido)
    response = await app_client.post(
        "/import/proyecto",
        files=files,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 413
    detail = response.json()["detail"]
    assert detail["bloqueado"] is True
    assert "excede el límite" in detail["mensaje"]
    assert detail["fila"] is None
