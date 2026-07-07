"""seed catalog options for tipo_dataset, tipo_de_acceso and constrain rol_archivo

Revision ID: e5a2c7b1f9d3
Revises: d4f7a1b9c3e2
Create Date: 2026-07-06 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e5a2c7b1f9d3'
down_revision: Union[str, Sequence[str], None] = 'd4f7a1b9c3e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Opciones de catálogo para los menús desplegables.
TIPO_DATASET_VALUES = (
    'Encuesta', 'Censo', 'Medición instrumental', 'Registro administrativo',
    'Estimación estadística', 'Índice', 'Cartografía', 'Raster',
    'Imagen satelital', 'Otro',
)
TIPO_DE_ACCESO_VALUES = (
    'descarga_directa', 'consulta_web', 'api_servicio', 'servicio_geografico',
    'repositorio', 'pagina_descriptiva', 'documentacion', 'solicitud_acceso',
    'transferencia_institucional', 'otro',
)

# Catálogo cerrado de rol_archivo. Debe coincidir con consts/rol_archivo.py.
ROL_ARCHIVO_VALUES = (
    'datos', 'catalogo', 'diccionario_datos', 'documentacion',
    'sistema_referencia', 'codificacion', 'geometria', 'metadato',
    'script', 'otro',
)


def _seed(table: str, values: tuple[str, ...]) -> None:
    """Insert catalog rows idempotently by unique nombre."""
    for nombre in values:
        op.execute(
            f"INSERT INTO {table} (id, nombre) "
            f"VALUES (gen_random_uuid(), '{nombre}') "
            f"ON CONFLICT (nombre) DO NOTHING"
        )


def upgrade() -> None:
    """Seed dropdown catalogs and add a CHECK constraint on archivo.rol_archivo."""
    # Normaliza la fila preexistente 'otro' para evitar duplicado con 'Otro'.
    op.execute("UPDATE tipo_dataset SET nombre = 'Otro' WHERE lower(nombre) = 'otro'")

    _seed('tipo_dataset', TIPO_DATASET_VALUES)
    _seed('tipo_de_acceso', TIPO_DE_ACCESO_VALUES)

    values = ', '.join(f"'{v}'" for v in ROL_ARCHIVO_VALUES)
    op.create_check_constraint(
        'rol_archivo_values', 'archivo',
        f'rol_archivo IS NULL OR rol_archivo IN ({values})',
    )


def downgrade() -> None:
    """Remove the rol_archivo CHECK and the seeded catalog rows."""
    op.drop_constraint(op.f('ck_archivo_rol_archivo_values'), 'archivo', type_='check')

    acceso = ', '.join(f"'{v}'" for v in TIPO_DE_ACCESO_VALUES)
    op.execute(f"DELETE FROM tipo_de_acceso WHERE nombre IN ({acceso})")

    dataset = ', '.join(f"'{v}'" for v in TIPO_DATASET_VALUES)
    op.execute(f"DELETE FROM tipo_dataset WHERE nombre IN ({dataset})")
