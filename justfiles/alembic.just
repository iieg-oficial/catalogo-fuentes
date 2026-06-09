set shell := ["bash", "-c"]
set working-directory := '..'

default:
    @just --list alembic

dev_db_host := "localhost"
dev_db_port := "5433"

# Muestra la revisión actual de Alembic
current: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic current

# Muestra el historial de migraciones
history: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic history

# Genera una nueva migración a partir de los cambios en los modelos  (uso: just alembic revision "add users table")
revision msg: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic revision --autogenerate -m "{{msg}}"

# Migra a una revisión específica  (uso: just alembic upgrade <revision>)
upgrade rev: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic upgrade {{rev}}

# Revierte la última migración aplicada
[confirm("¿Seguro que quieres revertir la última migración? [Y/N]:")]
downgrade: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic downgrade -1

# Revierte a una revisión específica  (uso: just alembic downgrade-to <revision>)
[confirm("¿Seguro que quieres revertir a esta revisión? [Y/N]:")]
downgrade-to rev: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic downgrade {{rev}}

# Marca una revisión como aplicada sin ejecutar DDL  (uso: just alembic stamp <revision>)
stamp rev: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic stamp {{rev}}

# Verifica si hay cambios en los modelos sin migración
check: _db-up
    @cd backend && POSTGRES_HOST={{dev_db_host}} POSTGRES_PORT={{dev_db_port}} \
        alembic check

[private]
_db-up:
    cd deploy && docker compose up -d db
    @until PGPASSWORD="$POSTGRES_PASSWORD" psql -h {{dev_db_host}} -p {{dev_db_port}} \
        -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "" -q 2>/dev/null; do sleep 1; done
