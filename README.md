<div align="center">

# Dashboard Tracking

**Catálogo de fuentes de datos del Instituto de Información Estadística y Geográfica de Jalisco**

Registra y navega la jerarquía de datos: proyectos → productos → fuentes → bases de datos → datasets → distribuciones → archivos.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## Desarrollo local

**Requisitos:** [`just`](https://github.com/casey/just), conda (env `dashboard`), Node.js 20+ y Docker (para la DB).

### Configuración inicial (una sola vez)

```bash
cd deploy
cp .env.example .env   # ajustar SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD si se desea
```

### Levantar todo

```bash
just dev-seed   # DB + migraciones + seed + backend + frontend
```

O si ya hay datos y solo quieres levantar los servicios:

```bash
just dev
```

### Comandos útiles

| Comando | Descripción |
|---|---|
| `just dev-seed` | DB + migraciones + seed completo + backend + frontend |
| `just dev` | DB + backend + frontend (sin seed) |
| `just dev-init` | Solo migraciones + superadmin (sin datos dummy) |
| `just dev-stop` | Detiene backend y frontend |
| `just dev-status` | Estado de los tres servicios |
| `just dev-roles` | Muestra usuarios de prueba y contraseñas |

App disponible en `http://localhost:5173`, API en `http://localhost:8000`.

Ver referencia completa de comandos en [`docs/justfile.md`](docs/justfile.md).

---

## Producción

**Requisitos:** [`just`](https://github.com/casey/just), Docker ≥ 24.0 y Docker Compose V2.

### Configuración inicial (una sola vez)

```bash
cd deploy
cp .env.example .env.prod   # completar todas las variables con valores reales
```

### Primer deploy

```bash
just prod   # construye imágenes, levanta servicios, aplica migraciones y crea superadmin
```

### Deploys posteriores

| Escenario | Comando |
|---|---|
| Cambio de UI o lógica (sin schema nuevo) | `just prod-deploy` |
| Nuevo schema (nueva migración SQL) | `just prod-migrate` |
| Reset completo (destruye datos) | `just prod` |

### Otros comandos de producción

| Comando | Descripción |
|---|---|
| `just prod-stop` | Detiene y elimina los contenedores |
| `just db-shell-prod` | Shell de psql contra la BD de producción |
| `just db-dump-prod` | Backup comprimido de la BD de producción |
| `just db-insert-prod <archivo>` | Restaura un backup en producción |
| `just logs-prod` | Sigue los logs de todos los servicios |

Ver referencia completa en [`docs/justfile.md`](docs/justfile.md).

---

<div align="center">

**IIEG** — Instituto de Información Estadística y Geográfica de Jalisco

</div>
