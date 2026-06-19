set shell := ["bash", "-c"]
set working-directory := '..'

default:
    @just --list prod

# Levanta todos los servicios en producción con BD propia y solo superadmin
[confirm("¿Seguro que quieres hacer un deploy completo a producción? Las migraciones nuevas pueden destruir datos. [Y/N]:")]
deploy-full:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml up -d --build db backend frontend
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml run --rm --build init

# Reconstruye y reinicia servicios en producción sin correr migraciones
deploy:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend frontend

# Aplica solo migraciones pendientes en producción sin reconstruir toda la app
migrate:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml run --rm --build init

# Detiene y elimina los contenedores de producción
stop:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml down

# Abre una shell de psql contra la BD de producción
shell:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Genera un dump comprimido de la BD de producción  (uso: just prod dump  o  just prod dump mi_dump.pgdump)
dump file="":
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

# Restaura un dump en la BD de producción  (uso: just prod insert <archivo>)
[confirm("¿Seguro que quieres restaurar el dump en la BD de producción? Los datos actuales se perderán. [Y/N]:")]
insert file:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml \
        exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists -1 < "../{{file}}"
    echo ""
    echo "  ✓ Dump restaurado en producción desde: {{file}}"
    echo ""
