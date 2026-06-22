from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

from routes.dependencies import get_current_user
from services import entidades as svc

router = APIRouter(prefix="/entidades", tags=["entidades"])


@router.get("/erd", response_class=HTMLResponse)
async def get_entidades_erd(_=Depends(get_current_user)) -> HTMLResponse:
    """Devuelve el diagrama entidad-relación interactivo de los modelos."""
    return HTMLResponse(content=svc.generate_entidades_erd_html())
