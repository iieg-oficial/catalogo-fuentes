"""tipo_periodo catalog

Revision ID: c1e9a4b7d2f6
Revises: 8f2c1a9d4b71
Create Date: 2026-06-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1e9a4b7d2f6'
down_revision: Union[str, Sequence[str], None] = '8f2c1a9d4b71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: turn edicion_dataset.tipo_periodo_referencia into a catalog."""
    # --- new catalog table --------------------------------------------------
    op.create_table(
        'tipo_periodo',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tipo_periodo')),
        sa.UniqueConstraint('nombre', name=op.f('uq_tipo_periodo_nombre')),
    )

    # --- edicion_dataset FK column -----------------------------------------
    op.add_column('edicion_dataset', sa.Column('tipo_periodo_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_edicion_dataset_tipo_periodo_id_tipo_periodo'), 'edicion_dataset', 'tipo_periodo',
        ['tipo_periodo_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(
        op.f('idx_edicion_dataset_tipo_periodo_id'), 'edicion_dataset', ['tipo_periodo_id'], unique=False,
    )

    # --- migrate existing string values into the catalog --------------------
    op.execute(
        """
        INSERT INTO tipo_periodo (id, nombre)
        SELECT gen_random_uuid(), t.nombre
        FROM (
            SELECT DISTINCT tipo_periodo_referencia AS nombre
            FROM edicion_dataset
            WHERE tipo_periodo_referencia IS NOT NULL AND tipo_periodo_referencia <> ''
        ) t
        """
    )
    op.execute(
        """
        UPDATE edicion_dataset e
        SET tipo_periodo_id = tp.id
        FROM tipo_periodo tp
        WHERE tp.nombre = e.tipo_periodo_referencia
        """
    )

    # --- base catalog values (fixed enumeration, must ship to every env) -----
    op.execute(
        """
        INSERT INTO tipo_periodo (id, nombre)
        SELECT gen_random_uuid(), v.nombre
        FROM (VALUES ('rango'), ('corte')) AS v(nombre)
        ON CONFLICT (nombre) DO NOTHING
        """
    )

    op.drop_column('edicion_dataset', 'tipo_periodo_referencia')


def downgrade() -> None:
    """Downgrade schema: restore edicion_dataset.tipo_periodo_referencia string column."""
    op.add_column('edicion_dataset', sa.Column('tipo_periodo_referencia', sa.String(), nullable=True))
    op.execute(
        """
        UPDATE edicion_dataset e
        SET tipo_periodo_referencia = tp.nombre
        FROM tipo_periodo tp
        WHERE tp.id = e.tipo_periodo_id
        """
    )

    op.drop_index(op.f('idx_edicion_dataset_tipo_periodo_id'), table_name='edicion_dataset')
    op.drop_constraint(op.f('fk_edicion_dataset_tipo_periodo_id_tipo_periodo'), 'edicion_dataset', type_='foreignkey')
    op.drop_column('edicion_dataset', 'tipo_periodo_id')

    op.drop_table('tipo_periodo')
