"""add puntaje and dictamen to edicion_dataset

Revision ID: d4f7a1b9c3e2
Revises: c1e9a4b7d2f6
Create Date: 2026-06-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd4f7a1b9c3e2'
down_revision: Union[str, Sequence[str], None] = 'c1e9a4b7d2f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Catálogo cerrado de dictamen (A1..C). Debe coincidir con consts/dictamen.py.
DICTAMEN_VALUES = ('A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'C')


def upgrade() -> None:
    """Upgrade schema: add puntaje (0-100) and dictamen (A1..C) to edicion_dataset."""
    op.add_column('edicion_dataset', sa.Column('puntaje', sa.Float(), nullable=True))
    op.add_column('edicion_dataset', sa.Column('dictamen', sa.String(), nullable=True))

    values = ', '.join(f"'{v}'" for v in DICTAMEN_VALUES)
    op.create_check_constraint(
        'puntaje_range', 'edicion_dataset',
        'puntaje IS NULL OR (puntaje >= 0 AND puntaje <= 100)',
    )
    op.create_check_constraint(
        'dictamen_values', 'edicion_dataset',
        f'dictamen IS NULL OR dictamen IN ({values})',
    )


def downgrade() -> None:
    """Downgrade schema: remove puntaje and dictamen from edicion_dataset."""
    op.drop_constraint(op.f('ck_edicion_dataset_dictamen_values'), 'edicion_dataset', type_='check')
    op.drop_constraint(op.f('ck_edicion_dataset_puntaje_range'), 'edicion_dataset', type_='check')
    op.drop_column('edicion_dataset', 'dictamen')
    op.drop_column('edicion_dataset', 'puntaje')
