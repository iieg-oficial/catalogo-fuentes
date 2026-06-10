set shell := ["bash", "-c"]
set working-directory := '..'

default:
    @just --list logs

# Sigue los logs de backend y frontend en desarrollo
dev:
    tail -f /tmp/dashboard-backend.log /tmp/dashboard-frontend.log

# Sigue los logs de los contenedores en producción
prod:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a && source deploy/.env.prod && set +a
    cd deploy
    docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.yml -f docker-compose.prod.yml logs -f
