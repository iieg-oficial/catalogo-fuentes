import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401 — ensures all models are registered before use
from routes.auth import router as auth_router
from routes.proyectos import router as proyectos_router
from routes.productos import router as productos_router
from routes.bases_de_datos import router as bases_de_datos_router
from routes.tablas import router as tablas_router
from routes.instrumentos import router as instrumentos_router
from routes.urls import router as urls_router
from routes.archivos import router as archivos_router
from routes.users import router as users_router
from routes.meta_columns import router as meta_columns_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Dashboard Tracking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(proyectos_router)
app.include_router(productos_router)
app.include_router(bases_de_datos_router)
app.include_router(tablas_router)
app.include_router(instrumentos_router)
app.include_router(urls_router)
app.include_router(archivos_router)
app.include_router(users_router)
app.include_router(meta_columns_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
