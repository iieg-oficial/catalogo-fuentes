"""drop medio_distribucion table and its FK from distribucion

Revision ID: f6b3d8c2a1e4
Revises: e5a2c7b1f9d3
Create Date: 2026-07-06 21:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = 'f6b3d8c2a1e4'
down_revision: Union[str, Sequence[str], None] = 'e5a2c7b1f9d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove the medio_distribucion FK from distribucion and drop the table."""
    op.drop_constraint(
        'fk_distribucion_medio_distribucion_id_medio_distribucion',
        'distribucion', type_='foreignkey',
    )
    op.drop_index('idx_distribucion_medio_distribucion_id', table_name='distribucion')
    op.drop_column('distribucion', 'medio_distribucion_id')
    op.drop_table('medio_distribucion')


def downgrade() -> None:
    """Recreate the medio_distribucion table and its FK on distribucion."""
    op.create_table(
        'medio_distribucion',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_medio_distribucion')),
        sa.UniqueConstraint('nombre', name=op.f('uq_medio_distribucion_nombre')),
    )
    op.add_column(
        'distribucion',
        sa.Column('medio_distribucion_id', UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        'idx_distribucion_medio_distribucion_id', 'distribucion', ['medio_distribucion_id'],
    )
    op.create_foreign_key(
        'fk_distribucion_medio_distribucion_id_medio_distribucion',
        'distribucion', 'medio_distribucion',
        ['medio_distribucion_id'], ['id'], ondelete='SET NULL',
    )
