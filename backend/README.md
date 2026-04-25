# Backend — Dashboard Tracking

FastAPI + SQLAlchemy async. API REST del catálogo de datos del IIEG.

## Requisitos

- Python 3.12+ vía conda (entorno `dashboard`)
- PostgreSQL 15+ (levantado via Docker con `just`)
- [`just`](https://github.com/casey/just)

## Levantar desde la raíz del monorepo

```bash
just dev-seed   # DB + seed + backend + frontend
```

## Ejecutar manualmente (desarrollo aislado)

```bash
# Activar el entorno conda
conda activate dashboard

# Instalar dependencias
pip install -r requirements.txt

# Levantar DB (desde la raíz)
cd ../deploy && docker compose up -d db && cd ../backend

# Crear tablas y cargar datos de prueba
POSTGRES_HOST=localhost POSTGRES_PORT=5433 python seed.py

# Levantar servidor
POSTGRES_HOST=localhost POSTGRES_PORT=5433 uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API disponible en `http://localhost:8000`. Documentación interactiva en `http://localhost:8000/docs`.

## Variables de entorno

| Variable          | Descripción                        | Default              |
|-------------------|------------------------------------|----------------------|
| `POSTGRES_HOST`   | Host de PostgreSQL                 | `localhost`          |
| `POSTGRES_PORT`   | Puerto de PostgreSQL               | `5432`               |
| `POSTGRES_USER`   | Usuario de PostgreSQL              | `iieg`               |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL         | `iieg_secret`        |
| `POSTGRES_DB`     | Nombre de la base de datos         | `dashboard_tracking` |
| `JWT_SECRET_KEY`  | Clave secreta para firmar tokens   | —                    |
| `JWT_ALGORITHM`   | Algoritmo JWT                      | `HS256`              |
| `JWT_EXPIRE_MINUTES` | Expiración del token (minutos)  | `60`                 |
| `ADMIN_EMAIL`     | Email del usuario administrador    | `admin@iieg.gob.mx`  |
| `ADMIN_PASSWORD`  | Contraseña del administrador       | —                    |

## Usuarios de prueba (seed)

| Email                  | Contraseña    | Rol        | Permisos            |
|------------------------|---------------|------------|---------------------|
| `ADMIN_EMAIL`          | `ADMIN_PASSWORD` | admin   | lectura y escritura |
| editor@iieg.gob.mx     | `Editor1234!` | maintainer | lectura y escritura |
| consulta@iieg.gob.mx   | `Viewer1234!` | viewer     | solo lectura        |
