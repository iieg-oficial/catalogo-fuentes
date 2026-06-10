set shell := ["bash", "-c"]
set working-directory := '..'

default:
    @just --list dev

dev_db_host := "localhost"
dev_db_port := "5433"

# Levanta DB, backend y frontend sin correr seed
start: _check-python _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        uvicorn main:app --reload --host 0.0.0.0 --port 8000 >> /tmp/dashboard-backend.log 2>&1 & disown
    @cd frontend && npm install --silent && VITE_API_URL=http://localhost:8000 npm run dev >> /tmp/dashboard-frontend.log 2>&1 & disown
    @sleep 4
    @echo ""
    @echo "  DB       → localhost:{{dev_db_port}}"
    @echo "  Backend  → http://localhost:8000   (logs: /tmp/dashboard-backend.log)"
    @echo "  Frontend → http://localhost:5173   (logs: /tmp/dashboard-frontend.log)"

# Corre migraciones y crea solo el superadmin (sin datos dummy)
init: _check-python _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        python seed.py dev-init
    @echo ""
    @echo "  ✓ Migraciones aplicadas y superadmin creado."
    @echo ""

# Levanta DB, corre migraciones + seed, backend y frontend
seed: _check-python _db-up
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
roles:
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
status:
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
stop:
    @pkill -f "[u]vicorn main:app" 2>/dev/null && echo "Backend detenido." || echo "Backend no estaba corriendo."
    @pkill -f "[v]ite" 2>/dev/null && echo "Frontend detenido." || echo "Frontend no estaba corriendo."

[private]
_check-python:
    @python --version 2>&1 | grep -qE "Python 3\.(12|13)" \
        || { echo "ERROR: se requiere Python 3.12 o 3.13 (detectado: $(python --version 2>&1))"; exit 1; }

[private]
_db-up:
    cd deploy && docker compose up -d db
    @until PGPASSWORD="$POSTGRES_PASSWORD" psql -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "" -q 2>/dev/null; do sleep 1; done
