set dotenv-path := "deploy/.env"
set shell := ["bash", "-c"]

# Conexión local: el .env usa "db" (nombre del servicio Docker), en dev siempre es localhost
dev_db_host := "localhost"
dev_db_port := "5433"

default:
    just --list --unsorted

# ─── DEVELOPMENT ──────────────────────────────────────────────────────────────

# Levanta DB, backend y frontend sin correr seed
[group('development')]
dev: _check-python _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 >> /tmp/dashboard-backend.log 2>&1 & disown
    @cd frontend && npm install --silent && VITE_API_URL=http://localhost:8000 npm run dev >> /tmp/dashboard-frontend.log 2>&1 & disown
    @sleep 4
    @echo ""
    @echo "  DB       → localhost:{{dev_db_port}}"
    @echo "  Backend  → http://localhost:8000   (logs: /tmp/dashboard-backend.log)"
    @echo "  Frontend → http://localhost:5173   (logs: /tmp/dashboard-frontend.log)"

# Corre migraciones y crea solo el superadmin (sin datos dummy)
[group('development')]
dev-init: _check-python _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        python seed.py dev-init
    @echo ""
    @echo "  ✓ Migraciones aplicadas y superadmin creado."
    @echo ""

# Levanta DB, corre migraciones + seed, backend y frontend
[group('development')]
dev-seed: _check-python _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} python seed.py
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 >> /tmp/dashboard-backend.log 2>&1 & disown
    @cd frontend && npm install --silent && VITE_API_URL=http://localhost:8000 npm run dev >> /tmp/dashboard-frontend.log 2>&1 & disown
    @sleep 4
    @echo ""
    @echo "  DB       → localhost:{{dev_db_port}}"
    @echo "  Backend  → http://localhost:8000   (logs: /tmp/dashboard-backend.log)"
    @echo "  Frontend → http://localhost:5173   (logs: /tmp/dashboard-frontend.log)"

# Muestra los usuarios dummy creados por el seed
[group('development')]
dev-roles:
    @echo ""
    @echo "  Email                      Contraseña      Rol"
    @echo "  ──────────────────────────────────────────────────────"
    @echo "  superadmin@iieg.gob.mx     Super1234!      superadmin"
    @echo "  admin@iieg.gob.mx          Admin1234!      admin"
    @echo "  editor@iieg.gob.mx         Editor1234!     maintainer"
    @echo "  consulta@iieg.gob.mx       Viewer1234!     viewer"
    @echo "  ──────────────────────────────────────────────────────"
    @echo "  Roles: superadmin > admin > maintainer > visualizer"
    @echo "  ──────────────────────────────────────────────────────"
    @echo ""

# Muestra el estado de los servicios de desarrollo
[group('development')]
dev-status:
    @echo ""
    @echo "  Servicio   Estado"
    @echo "  ─────────────────────────────────────────────"
    @pgrep -f "[u]vicorn main:app" > /dev/null \
        && echo "  Backend  → corriendo  (http://localhost:8000)" \
        || echo "  Backend  → detenido"
    @pgrep -f "[v]ite" > /dev/null \
        && echo "  Frontend → corriendo  (http://localhost:5173)" \
        || echo "  Frontend → detenido"
    @docker compose -f deploy/docker-compose.yml ps db --format json 2>/dev/null \
        | grep -q "healthy" \
        && echo "  DB       → corriendo  (localhost:{{dev_db_port}})" \
        || echo "  DB       → detenida"
    @echo ""

# Detiene backend y frontend locales
[group('development')]
dev-stop:
    @pkill -f "[u]vicorn main:app" 2>/dev/null && echo "Backend detenido." || echo "Backend no estaba corriendo."
    @pkill -f "[v]ite" 2>/dev/null && echo "Frontend detenido." || echo "Frontend no estaba corriendo."

# ─── DATABASE ─────────────────────────────────────────────────────────────────

# Aplica las migraciones pendientes sin tocar los datos
[group('database')]
db-migrate: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic upgrade head
    @echo ""
    @echo "  ✓ Migraciones aplicadas."
    @echo ""

# Limpia la BD, detiene los servicios y arranca todo de cero con seed
[group('database')]
[confirm("¿Seguro que quieres resetear la BD de desarrollo? Se perderán todos los datos. [Y/N]:")]
db-reset: _check-python
    @just db-clean
    @just dev-stop
    @just dev-seed

# Elimina todos los objetos del schema público y vuelve a aplicar las migraciones
[group('database')]
[confirm("¿Seguro que quieres limpiar la BD de desarrollo? Se perderán todos los datos. [Y/N]:")]
db-clean: _db-up
    @PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO \"$POSTGRES_USER\";"
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic upgrade head
    @echo ""
    @echo "  ✓ BD limpiada y migraciones aplicadas."
    @echo ""

# Genera un dump comprimido de la BD  (uso: just db-dump  o  just db-dump mi_dump.pgdump)
[group('database')]
db-dump file="": _db-up
    #!/usr/bin/env bash
    set -euo pipefail
    out="{{file}}"
    [ -z "$out" ] && out="dump_$(date +%Y%m%d_%H%M%S).pgdump"
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -Fc -f "$out"
    echo ""
    echo "  ✓ Dump guardado en: $out"
    echo ""

# Restaura un dump en la BD  (uso: just db-insert <archivo>)
[group('database')]
[confirm("¿Seguro que quieres restaurar el dump en la BD de desarrollo? Los datos actuales se perderán. [Y/N]:")]
db-insert file: _db-up
    @PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
        -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --clean --if-exists -1 {{file}}
    @echo ""
    @echo "  ✓ Dump restaurado desde: {{file}}"
    @echo ""

# ─── PRODUCTION ───────────────────────────────────────────────────────────────

# Levanta todos los servicios en producción con BD propia y solo superadmin
# Requiere deploy/.env.prod con las credenciales de producción
[group('production')]
[confirm("¿Seguro que quieres hacer un deploy completo a producción? Las migraciones nuevas pueden destruir datos. [Y/N]:")]
prod:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml up -d --build db backend frontend
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml run --rm --build init

# Genera un dump comprimido de la BD de producción  (uso: just db-dump-prod  o  just db-dump-prod mi_dump.pgdump)
[group('production')]
db-dump-prod file="":
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    out="{{file}}"
    [ -z "$out" ] && out="dump_prod_$(date +%Y%m%d_%H%M%S).pgdump"
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml \
        exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "../$out"
    echo ""
    echo "  ✓ Dump de producción guardado en: $out"
    echo ""

# Restaura un dump en la BD de producción  (uso: just db-insert-prod <archivo>)
[group('production')]
[confirm("¿Seguro que quieres restaurar el dump en la BD de producción? Los datos actuales se perderán. [Y/N]:")]
db-insert-prod file:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml \
        exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists -1 < "../{{file}}"
    echo ""
    echo "  ✓ Dump restaurado en producción desde: {{file}}"
    echo ""

# Reconstruye y reinicia servicios en producción sin correr migraciones (cambios de código sin schema)
[group('production')]
prod-deploy:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend frontend

# Aplica solo migraciones pendientes en producción sin reconstruir toda la app
[group('production')]
prod-migrate:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml run --rm --build init

# Abre una shell de psql contra la BD de producción
[group('production')]
db-shell-prod:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Detiene y elimina los contenedores de producción
[group('production')]
prod-stop:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml down

# ─── LOGS ─────────────────────────────────────────────────────────────────────

# Sigue los logs de backend y frontend en desarrollo
[group('logs')]
logs:
    tail -f /tmp/dashboard-backend.log /tmp/dashboard-frontend.log

# Sigue los logs de los contenedores en producción
[group('logs')]
logs-prod:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml logs -f

# ─── INTERNAL ─────────────────────────────────────────────────────────────────

[private]
_check-python:
    @python --version 2>&1 | grep -qE "Python 3\.(12|13)" \
        || { echo "ERROR: se requiere Python 3.12 o 3.13 (detectado: $(python --version 2>&1))"; exit 1; }

[private]
_db-up:
    cd deploy && docker compose up -d db
    @until PGPASSWORD="$POSTGRES_PASSWORD" psql -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "" -q 2>/dev/null; do sleep 1; done
