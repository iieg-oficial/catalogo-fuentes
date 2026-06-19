"""new tracking structure

Revision ID: 8f2c1a9d4b71
Revises: 4030e0153505
Create Date: 2026-06-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8f2c1a9d4b71'
down_revision: Union[str, Sequence[str], None] = '4030e0153505'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # --- new catalog tables -------------------------------------------------
    op.create_table(
        'tipo_dataset',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tipo_dataset')),
        sa.UniqueConstraint('nombre', name=op.f('uq_tipo_dataset_nombre')),
    )
    op.create_table(
        'tipo_de_acceso',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tipo_de_acceso')),
        sa.UniqueConstraint('nombre', name=op.f('uq_tipo_de_acceso_nombre')),
    )
    op.create_table(
        'medio_distribucion',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_medio_distribucion')),
        sa.UniqueConstraint('nombre', name=op.f('uq_medio_distribucion_nombre')),
    )
    op.create_table(
        'tabla_caracteristicas_archivo',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('archivo_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(
            ['archivo_id'], ['archivo.id'],
            name=op.f('fk_tabla_caracteristicas_archivo_archivo_id_archivo'), ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tabla_caracteristicas_archivo')),
    )
    op.create_index(
        op.f('idx_tabla_caracteristicas_archivo_archivo_id'),
        'tabla_caracteristicas_archivo', ['archivo_id'], unique=False,
    )

    # --- dataset ------------------------------------------------------------
    op.add_column('dataset', sa.Column('tipo_dataset_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_dataset_tipo_dataset_id_tipo_dataset'), 'dataset', 'tipo_dataset',
        ['tipo_dataset_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('idx_dataset_tipo_dataset_id'), 'dataset', ['tipo_dataset_id'], unique=False)
    op.add_column('dataset', sa.Column('nomenclatura_edicion', sa.String(), nullable=True))
    op.add_column('dataset', sa.Column('url_terminos_uso', sa.Text(), nullable=True))
    op.add_column('dataset', sa.Column('url_aviso_privacidad', sa.Text(), nullable=True))
    op.alter_column(
        'dataset', 'identificador_persistente',
        new_column_name='url_persistente', existing_type=sa.String(), type_=sa.Text(),
    )
    op.alter_column('dataset', 'cobertura_temporal_general', new_column_name='inicio_cobertura_temporal')

    # move terms/privacy URLs from fuente to its datasets
    op.execute(
        """
        UPDATE dataset
        SET url_terminos_uso = f.url_terminos_uso,
            url_aviso_privacidad = f.url_aviso_privacidad
        FROM fuente f
        WHERE dataset.fuente_id = f.id
        """
    )

    op.drop_column('dataset', 'url_pagina_principal')
    op.drop_column('dataset', 'url_metodologia_general')
    op.drop_column('dataset', 'url_metadatos_general')
    op.drop_column('dataset', 'unidad_observacion')
    op.drop_column('dataset', 'tema_principal')
    op.drop_column('dataset', 'fecha_inicio_disponibilidad')
    op.drop_column('dataset', 'fecha_fin_disponibilidad')

    # --- fuente -------------------------------------------------------------
    op.drop_column('fuente', 'jurisdiccion')
    op.drop_column('fuente', 'url_terminos_uso')
    op.drop_column('fuente', 'url_aviso_privacidad')

    # --- edicion_dataset ----------------------------------------------------
    op.alter_column('edicion_dataset', 'nombre', new_column_name='edicion')
    op.alter_column('edicion_dataset', 'url_documentacion_edicion', new_column_name='url_metodologia_edicion')
    op.add_column('edicion_dataset', sa.Column('url_metadatos_edicion', sa.Text(), nullable=True))
    op.drop_column('edicion_dataset', 'fecha_levantamiento_inicio')
    op.drop_column('edicion_dataset', 'fecha_levantamiento_fin')
    op.drop_column('edicion_dataset', 'url_comunicado_publicacion')
    op.drop_column('edicion_dataset', 'version_publicacion')
    op.drop_column('edicion_dataset', 'es_version_corregida')

    # --- distribucion -------------------------------------------------------
    op.add_column('distribucion', sa.Column('dataset_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_distribucion_dataset_id_dataset'), 'distribucion', 'dataset',
        ['dataset_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('idx_distribucion_dataset_id'), 'distribucion', ['dataset_id'], unique=False)
    op.add_column('distribucion', sa.Column('tipo_de_acceso_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_distribucion_tipo_de_acceso_id_tipo_de_acceso'), 'distribucion', 'tipo_de_acceso',
        ['tipo_de_acceso_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('idx_distribucion_tipo_de_acceso_id'), 'distribucion', ['tipo_de_acceso_id'], unique=False)
    op.add_column('distribucion', sa.Column('medio_distribucion_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_distribucion_medio_distribucion_id_medio_distribucion'), 'distribucion', 'medio_distribucion',
        ['medio_distribucion_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(
        op.f('idx_distribucion_medio_distribucion_id'), 'distribucion', ['medio_distribucion_id'], unique=False,
    )
    op.alter_column('distribucion', 'descriptor', new_column_name='distribucion')
    op.alter_column('distribucion', 'requiere_autenticacion', new_column_name='requiere_control_de_acceso')

    # backfill dataset_id from the linked edition
    op.execute(
        """
        UPDATE distribucion
        SET dataset_id = ed.dataset_id
        FROM edicion_dataset ed
        WHERE distribucion.edicion_dataset_id = ed.id
        """
    )

    op.drop_column('distribucion', 'requiere_registro')
    op.drop_column('distribucion', 'estado_url_ultima_revision')

    # --- archivo ------------------------------------------------------------
    op.add_column('archivo', sa.Column('fecha_obtencion', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('archivo', 'fecha_ingesta_sistema', new_column_name='fecha_ingesta')
    op.drop_column('archivo', 'archivos_relacionados')
    op.drop_column('archivo', 'ruta_almacenamiento')

    # --- base_de_datos: FK dataset -> archivo --------------------------------
    op.drop_index(op.f('idx_base_de_datos_dataset_id'), table_name='base_de_datos')
    op.drop_constraint(op.f('fk_base_de_datos_dataset_id_dataset'), 'base_de_datos', type_='foreignkey')
    op.drop_column('base_de_datos', 'dataset_id')
    op.add_column('base_de_datos', sa.Column('archivo_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_base_de_datos_archivo_id_archivo'), 'base_de_datos', 'archivo',
        ['archivo_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('idx_base_de_datos_archivo_id'), 'base_de_datos', ['archivo_id'], unique=False)
    op.add_column('base_de_datos', sa.Column('etiquetas', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.drop_column('base_de_datos', 'meta')

    # --- informacion_tablas: direct FK to producto ---------------------------
    op.add_column('informacion_tablas', sa.Column('producto_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_informacion_tablas_producto_id_producto'), 'informacion_tablas', 'producto',
        ['producto_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('idx_informacion_tablas_producto_id'), 'informacion_tablas', ['producto_id'], unique=False)

    # migrate links from producto_tabla (keeps the oldest link per table)
    op.execute(
        """
        UPDATE informacion_tablas it
        SET producto_id = (
            SELECT pt.producto_id
            FROM producto_tabla pt
            WHERE pt.informacion_tablas_id = it.id
            ORDER BY pt.created_at ASC
            LIMIT 1
        )
        """
    )

    op.drop_index(op.f('idx_producto_tabla_producto_id'), table_name='producto_tabla')
    op.drop_index(op.f('idx_producto_tabla_informacion_tablas_id'), table_name='producto_tabla')
    op.drop_table('producto_tabla')

    # --- proyecto -------------------------------------------------------------
    op.drop_index(op.f('idx_proyecto_usuario_id'), table_name='proyecto')
    op.drop_constraint(op.f('fk_proyecto_usuario_id_usuario'), 'proyecto', type_='foreignkey')
    op.drop_column('proyecto', 'usuario_id')


def downgrade() -> None:
    """Downgrade schema."""
    # --- proyecto -------------------------------------------------------------
    op.add_column('proyecto', sa.Column('usuario_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_proyecto_usuario_id_usuario'), 'proyecto', 'usuario',
        ['usuario_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('idx_proyecto_usuario_id'), 'proyecto', ['usuario_id'], unique=False)

    # --- producto_tabla -------------------------------------------------------
    op.create_table(
        'producto_tabla',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('fecha_vinculacion', sa.Date(), nullable=True),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('producto_id', sa.UUID(), nullable=False),
        sa.Column('informacion_tablas_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ['informacion_tablas_id'], ['informacion_tablas.id'],
            name=op.f('fk_producto_tabla_informacion_tablas_id_informacion_tablas'), ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['producto_id'], ['producto.id'],
            name=op.f('fk_producto_tabla_producto_id_producto'), ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_producto_tabla')),
    )
    op.create_index(op.f('idx_producto_tabla_informacion_tablas_id'), 'producto_tabla', ['informacion_tablas_id'], unique=False)
    op.create_index(op.f('idx_producto_tabla_producto_id'), 'producto_tabla', ['producto_id'], unique=False)
    op.execute(
        """
        INSERT INTO producto_tabla (id, producto_id, informacion_tablas_id)
        SELECT gen_random_uuid(), producto_id, id
        FROM informacion_tablas
        WHERE producto_id IS NOT NULL
        """
    )
    op.drop_index(op.f('idx_informacion_tablas_producto_id'), table_name='informacion_tablas')
    op.drop_constraint(op.f('fk_informacion_tablas_producto_id_producto'), 'informacion_tablas', type_='foreignkey')
    op.drop_column('informacion_tablas', 'producto_id')

    # --- base_de_datos --------------------------------------------------------
    op.add_column(
        'base_de_datos',
        sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
    )
    op.drop_column('base_de_datos', 'etiquetas')
    op.drop_index(op.f('idx_base_de_datos_archivo_id'), table_name='base_de_datos')
    op.drop_constraint(op.f('fk_base_de_datos_archivo_id_archivo'), 'base_de_datos', type_='foreignkey')
    op.drop_column('base_de_datos', 'archivo_id')
    op.add_column('base_de_datos', sa.Column('dataset_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        op.f('fk_base_de_datos_dataset_id_dataset'), 'base_de_datos', 'dataset',
        ['dataset_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('idx_base_de_datos_dataset_id'), 'base_de_datos', ['dataset_id'], unique=False)

    # --- archivo ---------------------------------------------------------------
    op.add_column('archivo', sa.Column('ruta_almacenamiento', sa.Text(), nullable=True))
    op.add_column(
        'archivo',
        sa.Column('archivos_relacionados', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
    )
    op.alter_column('archivo', 'fecha_ingesta', new_column_name='fecha_ingesta_sistema')
    op.drop_column('archivo', 'fecha_obtencion')

    # --- distribucion ----------------------------------------------------------
    op.add_column('distribucion', sa.Column('estado_url_ultima_revision', sa.String(), nullable=True))
    op.add_column(
        'distribucion',
        sa.Column('requiere_registro', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )
    op.alter_column('distribucion', 'requiere_control_de_acceso', new_column_name='requiere_autenticacion')
    op.alter_column('distribucion', 'distribucion', new_column_name='descriptor')
    op.drop_index(op.f('idx_distribucion_medio_distribucion_id'), table_name='distribucion')
    op.drop_constraint(op.f('fk_distribucion_medio_distribucion_id_medio_distribucion'), 'distribucion', type_='foreignkey')
    op.drop_column('distribucion', 'medio_distribucion_id')
    op.drop_index(op.f('idx_distribucion_tipo_de_acceso_id'), table_name='distribucion')
    op.drop_constraint(op.f('fk_distribucion_tipo_de_acceso_id_tipo_de_acceso'), 'distribucion', type_='foreignkey')
    op.drop_column('distribucion', 'tipo_de_acceso_id')
    op.drop_index(op.f('idx_distribucion_dataset_id'), table_name='distribucion')
    op.drop_constraint(op.f('fk_distribucion_dataset_id_dataset'), 'distribucion', type_='foreignkey')
    op.drop_column('distribucion', 'dataset_id')

    # --- edicion_dataset ---------------------------------------------------------
    op.add_column(
        'edicion_dataset',
        sa.Column('es_version_corregida', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    )
    op.add_column('edicion_dataset', sa.Column('version_publicacion', sa.String(), nullable=True))
    op.add_column('edicion_dataset', sa.Column('url_comunicado_publicacion', sa.Text(), nullable=True))
    op.add_column('edicion_dataset', sa.Column('fecha_levantamiento_fin', sa.Date(), nullable=True))
    op.add_column('edicion_dataset', sa.Column('fecha_levantamiento_inicio', sa.Date(), nullable=True))
    op.drop_column('edicion_dataset', 'url_metadatos_edicion')
    op.alter_column('edicion_dataset', 'url_metodologia_edicion', new_column_name='url_documentacion_edicion')
    op.alter_column('edicion_dataset', 'edicion', new_column_name='nombre')

    # --- fuente ---------------------------------------------------------------
    op.add_column('fuente', sa.Column('url_aviso_privacidad', sa.Text(), nullable=True))
    op.add_column('fuente', sa.Column('url_terminos_uso', sa.Text(), nullable=True))
    op.add_column('fuente', sa.Column('jurisdiccion', sa.String(), nullable=True))

    # --- dataset ----------------------------------------------------------------
    op.add_column('dataset', sa.Column('fecha_fin_disponibilidad', sa.Date(), nullable=True))
    op.add_column('dataset', sa.Column('fecha_inicio_disponibilidad', sa.Date(), nullable=True))
    op.add_column('dataset', sa.Column('tema_principal', sa.String(), nullable=True))
    op.add_column('dataset', sa.Column('unidad_observacion', sa.String(), nullable=True))
    op.add_column('dataset', sa.Column('url_metadatos_general', sa.Text(), nullable=True))
    op.add_column('dataset', sa.Column('url_metodologia_general', sa.Text(), nullable=True))
    op.add_column('dataset', sa.Column('url_pagina_principal', sa.Text(), nullable=True))
    op.alter_column('dataset', 'inicio_cobertura_temporal', new_column_name='cobertura_temporal_general')
    op.alter_column(
        'dataset', 'url_persistente',
        new_column_name='identificador_persistente', existing_type=sa.Text(), type_=sa.String(),
    )
    op.drop_column('dataset', 'url_aviso_privacidad')
    op.drop_column('dataset', 'url_terminos_uso')
    op.drop_column('dataset', 'nomenclatura_edicion')
    op.drop_index(op.f('idx_dataset_tipo_dataset_id'), table_name='dataset')
    op.drop_constraint(op.f('fk_dataset_tipo_dataset_id_tipo_dataset'), 'dataset', type_='foreignkey')
    op.drop_column('dataset', 'tipo_dataset_id')

    # --- new catalog tables -------------------------------------------------------
    op.drop_index(op.f('idx_tabla_caracteristicas_archivo_archivo_id'), table_name='tabla_caracteristicas_archivo')
    op.drop_table('tabla_caracteristicas_archivo')
    op.drop_table('medio_distribucion')
    op.drop_table('tipo_de_acceso')
    op.drop_table('tipo_dataset')
