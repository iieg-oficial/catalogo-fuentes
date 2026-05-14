-- v4 schema migration: full rebuild (no data to preserve)

BEGIN;

-- 1) Drop ALL tables (old schema + new schema) so this migration is idempotent
DROP TABLE IF EXISTS meta_column_config CASCADE;
DROP TABLE IF EXISTS url CASCADE;
DROP TABLE IF EXISTS instrumento CASCADE;
DROP TABLE IF EXISTS tabla_producto CASCADE;
DROP TABLE IF EXISTS tabla CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS producto_tabla CASCADE;
DROP TABLE IF EXISTS informacion_tablas CASCADE;
DROP TABLE IF EXISTS archivo CASCADE;
DROP TABLE IF EXISTS distribucion CASCADE;
DROP TABLE IF EXISTS edicion_dataset CASCADE;
DROP TABLE IF EXISTS dataset CASCADE;
DROP TABLE IF EXISTS fuente CASCADE;
DROP TABLE IF EXISTS base_de_datos CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS proyecto CASCADE;
DROP TABLE IF EXISTS permiso_rol CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;
DROP TABLE IF EXISTS permiso CASCADE;

-- 2) Drop old enum type
DROP TYPE IF EXISTS user_role;

-- 3) Ensure uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- RBAC
-- =====================

CREATE TABLE permiso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE rol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE permiso_rol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    permiso_id UUID NOT NULL REFERENCES permiso(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
    UNIQUE (permiso_id, rol_id)
);

CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR,
    correo VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    rol_id UUID REFERENCES rol(id) ON DELETE SET NULL
);

-- =====================
-- Catalog: Proyecto / Producto
-- =====================

CREATE TABLE proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL
);

CREATE TABLE producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    proyecto_id UUID REFERENCES proyecto(id) ON DELETE SET NULL
);

-- =====================
-- Catalog: Fuente → Dataset → EdicionDataset → Distribucion → Archivo
-- =====================

CREATE TABLE fuente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    nombre_corto VARCHAR,
    sector VARCHAR,
    ambito VARCHAR,
    url TEXT,
    descripcion TEXT,
    es_fuente_oficial BOOLEAN NOT NULL DEFAULT FALSE,
    es_publicador BOOLEAN NOT NULL DEFAULT FALSE,
    jurisdiccion VARCHAR,
    url_terminos_uso TEXT,
    url_aviso_privacidad TEXT,
    contacto_institucional VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE dataset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    nombre_corto VARCHAR,
    descripcion TEXT,
    identificador_persistente VARCHAR,
    periodicidad VARCHAR,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    url_pagina_principal TEXT,
    url_metodologia_general TEXT,
    url_metadatos_general TEXT,
    desagregacion_geografica VARCHAR,
    cobertura_temporal_general VARCHAR,
    unidad_observacion VARCHAR,
    tema_principal VARCHAR,
    proposito TEXT,
    fecha_inicio_disponibilidad DATE,
    fecha_fin_disponibilidad DATE,
    observaciones_dataset TEXT,
    etiquetas JSONB NOT NULL DEFAULT '[]'::jsonb,
    url_normativa_o_marco_legal TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    fuente_id UUID REFERENCES fuente(id) ON DELETE SET NULL
);

CREATE TABLE edicion_dataset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    fecha_publicacion DATE,
    periodo_referencia_inicio DATE,
    periodo_referencia_fin DATE,
    tipo_periodo_referencia VARCHAR,
    fecha_levantamiento_inicio DATE,
    fecha_levantamiento_fin DATE,
    url_documentacion_edicion TEXT,
    url_comunicado_publicacion TEXT,
    observaciones_edicion TEXT,
    version_publicacion VARCHAR,
    es_version_corregida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    dataset_id UUID REFERENCES dataset(id) ON DELETE SET NULL
);

CREATE TABLE distribucion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descriptor VARCHAR,
    url TEXT,
    requiere_autenticacion BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_registro BOOLEAN NOT NULL DEFAULT FALSE,
    es_url_persistente BOOLEAN NOT NULL DEFAULT FALSE,
    estado_url_ultima_revision VARCHAR,
    observaciones_distribucion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    edicion_dataset_id UUID REFERENCES edicion_dataset(id) ON DELETE SET NULL
);

CREATE TABLE archivo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_archivo VARCHAR NOT NULL,
    ruta_relativa_en_distribucion VARCHAR,
    rol_archivo VARCHAR,
    fecha_ingesta_sistema TIMESTAMPTZ,
    tamano_bytes BIGINT,
    archivos_relacionados JSONB NOT NULL DEFAULT '{}'::jsonb,
    ruta_almacenamiento TEXT,
    observaciones_archivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    distribucion_id UUID REFERENCES distribucion(id) ON DELETE SET NULL
);

-- =====================
-- Catalog: BaseDeDatos → InformacionTablas, ProductoTabla
-- =====================

CREATE TABLE base_de_datos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    db_nombre VARCHAR NOT NULL,
    descripcion_esquema JSONB NOT NULL DEFAULT '{}'::jsonb,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    dataset_id UUID REFERENCES dataset(id) ON DELETE SET NULL
);

CREATE TABLE informacion_tablas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    base_de_datos_id UUID REFERENCES base_de_datos(id) ON DELETE SET NULL
);

CREATE TABLE producto_tabla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_vinculacion DATE,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    informacion_tablas_id UUID NOT NULL REFERENCES informacion_tablas(id) ON DELETE CASCADE
);

-- =====================
-- Indexes
-- =====================

-- RBAC
CREATE INDEX idx_permiso_rol_permiso_id ON permiso_rol(permiso_id);
CREATE INDEX idx_permiso_rol_rol_id ON permiso_rol(rol_id);
CREATE INDEX idx_usuario_correo ON usuario(correo);
CREATE INDEX idx_usuario_rol_id ON usuario(rol_id);

-- Proyecto / Producto
CREATE INDEX idx_proyecto_nombre ON proyecto(nombre);
CREATE INDEX idx_proyecto_usuario_id ON proyecto(usuario_id);
CREATE INDEX idx_producto_nombre ON producto(nombre);
CREATE INDEX idx_producto_proyecto_id ON producto(proyecto_id);

-- Fuente chain
CREATE INDEX idx_fuente_nombre ON fuente(nombre);
CREATE INDEX idx_dataset_nombre ON dataset(nombre);
CREATE INDEX idx_dataset_fuente_id ON dataset(fuente_id);
CREATE INDEX idx_edicion_dataset_dataset_id ON edicion_dataset(dataset_id);
CREATE INDEX idx_edicion_dataset_fecha_publicacion ON edicion_dataset(fecha_publicacion);
CREATE INDEX idx_distribucion_edicion_dataset_id ON distribucion(edicion_dataset_id);
CREATE INDEX idx_archivo_distribucion_id ON archivo(distribucion_id);

-- BaseDeDatos chain
CREATE INDEX idx_base_de_datos_nombre ON base_de_datos(db_nombre);
CREATE INDEX idx_base_de_datos_dataset_id ON base_de_datos(dataset_id);
CREATE INDEX idx_informacion_tablas_nombre ON informacion_tablas(nombre);
CREATE INDEX idx_informacion_tablas_base_de_datos_id ON informacion_tablas(base_de_datos_id);
CREATE INDEX idx_producto_tabla_producto_id ON producto_tabla(producto_id);
CREATE INDEX idx_producto_tabla_informacion_tablas_id ON producto_tabla(informacion_tablas_id);

COMMIT;
