# Deploy — Dashboard Tracking

Configuración de contenedores y despliegue del monorepo.

## Entornos

| Entorno | Comando | Base de datos | Datos iniciales |
|---------|---------|---------------|-----------------|
| Desarrollo local | `just dev` | Docker, credenciales dev | Ninguno (ver abajo) |
| Producción | `just prod` | Docker, credenciales prod | Solo superadmin |

## Archivos de entorno

| Archivo | Uso |
|---------|-----|
| `deploy/.env` | Desarrollo — nunca se versiona |
| `deploy/.env.example` | Plantilla para dev |
| `deploy/.env.prod` | Producción — nunca se versiona |
| `deploy/.env.prod.example` | Plantilla para prod |

## Desarrollo local

```bash
# Primera vez o BD limpia
just dev-init       # migraciones + superadmin (sin datos dummy)
# o bien
just dev-seed       # migraciones + 4 usuarios dummy + catálogo de ejemplo

# Levantar servicios
just dev            # DB (Docker) + backend (conda) + frontend (npm)
just dev-stop       # detener backend y frontend
```

### Usuarios dummy (solo dev-seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| superadmin@iieg.gob.mx | Super1234! | superadmin |
| admin@iieg.gob.mx | Admin1234! | admin |
| editor@iieg.gob.mx | Editor1234! | maintainer |
| consulta@iieg.gob.mx | Viewer1234! | viewer |

## Producción

```bash
# 1. Crear archivo de entorno de producción
cp deploy/.env.prod.example deploy/.env.prod
# Editar con credenciales reales

# 2. Levantar
just prod           # Docker: DB + backend + frontend + init (solo superadmin)
just prod-stop      # detener
just logs-prod      # ver logs
```

### Variables requeridas en `.env.prod`

```env
COMPOSE_PROJECT_NAME=dashboard-prod

POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=usuario_prod
POSTGRES_PASSWORD=contraseña_segura
POSTGRES_DB=dashboard_prod

JWT_SECRET_KEY=clave-larga-y-aleatoria
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

SUPERADMIN_EMAIL=email@iieg.gob.mx
SUPERADMIN_PASSWORD=ContraseñaSegura123!

VITE_API_URL=http://IP_O_DOMINIO:8000
```

## Puertos

| Servicio | Puerto |
|---------|--------|
| Frontend | 80 (prod) / 5173 (dev) |
| Backend | 8000 |
| PostgreSQL | 5433 (dev, expuesto al host) |

## Servicios Docker

| Servicio | Descripción |
|---------|-------------|
| `db` | PostgreSQL 15 |
| `backend` | FastAPI + uvicorn |
| `frontend` | Build estático servido por nginx |
| `seed` | Corre migraciones + seed completo (solo dev) |
| `init` | Corre migraciones + superadmin (solo prod) |
