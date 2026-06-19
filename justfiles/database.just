set shell := ["bash", "-c"]
set working-directory := '..'

default:
    @just --list db

dev_db_host := "localhost"
dev_db_port := "5433"

# Aplica las migraciones pendientes sin tocar los datos
migrate: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic upgrade head
    @echo ""
    @echo "  ✓ Migraciones aplicadas."
    @echo ""

# Limpia la BD, detiene los servicios y arranca todo de cero con seed
[confirm("¿Seguro que quieres resetear la BD de desarrollo? Se perderán todos los datos. [Y/N]:")]
reset: _check-python
    @just db clean
    @just dev stop
    @just dev seed

# Elimina todos los objetos del schema público y vuelve a aplicar las migraciones
[confirm("¿Seguro que quieres limpiar la BD de desarrollo? Se perderán todos los datos. [Y/N]:")]
clean: _db-up
    @PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q \
        -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO \"$POSTGRES_USER\";"
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic upgrade head
    @echo ""
    @echo "  ✓ BD limpiada y migraciones aplicadas."
    @echo ""

# Genera un dump comprimido de la BD  (uso: just db dump  o  just db dump mi_dump.pgdump)
dump file="": _db-up
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

# Restaura un dump en la BD  (uso: just db insert <archivo>)
[confirm("¿Seguro que quieres restaurar el dump en la BD de desarrollo? Los datos actuales se perderán. [Y/N]:")]
insert file: _db-up
    @PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
        -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --clean --if-exists -1 {{file}}
    @echo ""
    @echo "  ✓ Dump restaurado desde: {{file}}"
    @echo ""

[private]
_check-python:
    @python --version 2>&1 | grep -qE "Python 3\.(12|13)" \
        || { echo "ERROR: se requiere Python 3.12 o 3.13 (detectado: $(python --version 2>&1))"; exit 1; }

[private]
_db-up:
    cd deploy && docker compose up -d db
    @until PGPASSWORD="$POSTGRES_PASSWORD" psql -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "" -q 2>/dev/null; do sleep 1; done
