<div align="center">

# Dashboard Tracking

**Catálogo de fuentes de datos del Instituto de Información Estadística y Geográfica de Jalisco**

Registra y navega la jerarquía de datos: bases de datos → instrumentos → URLs → archivos, vinculada a proyectos y productos.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## Docker

La forma más rápida de levantar todo el proyecto.

**Requisitos:** Docker ≥ 24.0 y Docker Compose V2.

```bash
# 1. Configurar variables de entorno
cd deploy
cp .env.example .env

# 2. Construir y levantar los servicios
docker compose up -d --build

# 3. Crear tablas y cargar datos de prueba
docker compose run --rm seed
```

La app queda disponible en `http://localhost`.

El usuario administrador se crea con las credenciales definidas en `ADMIN_EMAIL` y `ADMIN_PASSWORD` del archivo `.env`.

---

## Desarrollo local

**Requisitos:** [`just`](https://github.com/casey/just), conda (env `dashboard`), Node.js 20+ y Docker (para la DB).

### Configuración inicial (una sola vez)

```bash
cd deploy
cp .env.example .env   # ajustar ADMIN_EMAIL y ADMIN_PASSWORD si se desea
```

### Levantar todo

```bash
just dev-seed   # DB + migraciones + seed + backend + frontend
```

O si ya hay datos y solo quieres levantar los servicios:

```bash
just dev
```

### Otros comandos útiles

| Comando | Descripción |
|---|---|
| `just dev-seed` | DB + seed + backend + frontend |
| `just dev` | DB + backend + frontend (sin seed) |
| `just dev-stop` | Detiene backend y frontend |
| `just dev-status` | Estado de los tres servicios |
| `just dev-roles` | Muestra usuarios de prueba |

App disponible en `http://localhost:5173`, API en `http://localhost:8000`.

---

<div align="center">

**IIEG** — Instituto de Información Estadística y Geográfica de Jalisco

</div>
