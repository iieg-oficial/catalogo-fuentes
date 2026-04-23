# Backend — Dashboard Tracking

FastAPI + SQLAlchemy async. API REST del catálogo de datos del IIEG.

## Requisitos

- Python 3.12+
- PostgreSQL 15+ corriendo localmente

## Pasos

```bash
# 1. Entrar a la carpeta
cd backend

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Crear entorno virtual e instalar dependencias
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 4. Crear tablas y cargar datos de prueba
python seed.py

# 5. Levantar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
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
