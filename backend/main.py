import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401 — ensures all models are registered before use
from config import settings
from routes.auth import router as auth_router
from routes.permisos import router as permisos_router
from routes.roles import router as roles_router
from routes.usuarios import router as usuarios_router
from routes.proyectos import router as proyectos_router
from routes.productos import router as productos_router
from routes.fuentes import router as fuentes_router
from routes.tipos_dataset import router as tipos_dataset_router
from routes.datasets import router as datasets_router
from routes.tipos_periodo import router as tipos_periodo_router
from routes.ediciones_dataset import router as ediciones_dataset_router
from routes.tipos_de_acceso import router as tipos_de_acceso_router
from routes.distribuciones import router as distribuciones_router
from routes.bases_de_datos import router as bases_de_datos_router
from routes.informacion_tablas import router as informacion_tablas_router
from routes.archivos import router as archivos_router
from routes.entidades import router as entidades_router
from routes.import_ import router as import_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Dashboard Tracking API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(permisos_router)
app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(proyectos_router)
app.include_router(productos_router)
app.include_router(fuentes_router)
app.include_router(tipos_dataset_router)
app.include_router(datasets_router)
app.include_router(tipos_periodo_router)
app.include_router(ediciones_dataset_router)
app.include_router(tipos_de_acceso_router)
app.include_router(distribuciones_router)
app.include_router(bases_de_datos_router)
app.include_router(informacion_tablas_router)
app.include_router(archivos_router)
app.include_router(entidades_router)
app.include_router(import_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
