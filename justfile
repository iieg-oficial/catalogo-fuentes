set dotenv-path := "deploy/.env"

mod dev     'justfiles/development.just'
mod db      'justfiles/database.just'
mod alembic 'justfiles/alembic.just'
mod prod    'justfiles/production.just'
mod logs    'justfiles/logs.just'

default:
    @just --list --list-submodules
