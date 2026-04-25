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
    @echo "  Email                     Contraseña      Rol"
    @echo "  ────────────────────────────────────────────────────"
    @echo "  admin@iieg.gob.mx         Admin1234!      admin"
    @echo "  editor@iieg.gob.mx        Editor1234!     maintainer"
    @echo "  consulta@iieg.gob.mx      Viewer1234!     viewer"
    @echo "  ────────────────────────────────────────────────────"
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

# ─── PRODUCTION ───────────────────────────────────────────────────────────────

# Construye imágenes y levanta todos los servicios en producción
[group('production')]
prod:
    cd deploy && docker compose up -d --build db backend frontend

# Detiene y elimina los contenedores de producción
[group('production')]
prod-stop:
    cd deploy && docker compose down

# ─── LOGS ─────────────────────────────────────────────────────────────────────

# Sigue los logs de backend y frontend en desarrollo
[group('logs')]
logs:
    tail -f /tmp/dashboard-backend.log /tmp/dashboard-frontend.log

# Sigue los logs de todos los contenedores en producción
[group('logs')]
logs-prod:
    cd deploy && docker compose logs -f

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
