"""update dictamen catalog values (A5/B1/B2 -> B)

Revision ID: a7c4e9f2b6d1
Revises: f6b3d8c2a1e4
Create Date: 2026-07-06 21:15:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a7c4e9f2b6d1'
down_revision: Union[str, Sequence[str], None] = 'f6b3d8c2a1e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Catálogo cerrado de dictamen. Debe coincidir con consts/dictamen.py.
DICTAMEN_VALUES_NEW = ('A1', 'A2', 'A3', 'A4', 'B', 'C')
DICTAMEN_VALUES_OLD = ('A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'C')


def _recreate_check(values: tuple[str, ...]) -> None:
    """Drop and recreate the dictamen CHECK constraint with the given value set."""
    op.drop_constraint(op.f('ck_edicion_dataset_dictamen_values'), 'edicion_dataset', type_='check')
    joined = ', '.join(f"'{v}'" for v in values)
    op.create_check_constraint(
        'dictamen_values', 'edicion_dataset',
        f'dictamen IS NULL OR dictamen IN ({joined})',
    )


def upgrade() -> None:
    """Remap retired dictamen codes to B and constrain to the new value set."""
    op.execute("UPDATE edicion_dataset SET dictamen = 'B' WHERE dictamen IN ('A5', 'B1', 'B2')")
    _recreate_check(DICTAMEN_VALUES_NEW)


def downgrade() -> None:
    """Restore the previous dictamen value set (data remap is not reversible)."""
    _recreate_check(DICTAMEN_VALUES_OLD)
