CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'maintainer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS base_de_datos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    tema VARCHAR,
    frecuencia_actualizacion VARCHAR,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tabla (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_de_datos_id UUID NOT NULL REFERENCES base_de_datos(id) ON DELETE CASCADE,
    nombre VARCHAR NOT NULL,
    campos JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tabla_producto (
    tabla_id UUID NOT NULL REFERENCES tabla(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    PRIMARY KEY (tabla_id, producto_id)
);

CREATE TABLE IF NOT EXISTS instrumento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_de_datos_id UUID NOT NULL REFERENCES base_de_datos(id) ON DELETE CASCADE,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    fecha_publicacion DATE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS url (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrumento_id UUID NOT NULL REFERENCES instrumento(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS archivo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES url(id) ON DELETE CASCADE,
    descripcion TEXT,
    fecha_publicacion DATE,
    fecha_fuente VARCHAR,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
