-- Change FK constraints from ON DELETE CASCADE to ON DELETE SET NULL
-- so that deleting a parent entity nullifies the FK in children instead of deleting them.

-- producto.proyecto_id
ALTER TABLE producto ALTER COLUMN proyecto_id DROP NOT NULL;
ALTER TABLE producto DROP CONSTRAINT IF EXISTS producto_proyecto_id_fkey;
ALTER TABLE producto ADD CONSTRAINT producto_proyecto_id_fkey
  FOREIGN KEY (proyecto_id) REFERENCES proyecto(id) ON DELETE SET NULL;

-- tabla.base_de_datos_id
ALTER TABLE tabla ALTER COLUMN base_de_datos_id DROP NOT NULL;
ALTER TABLE tabla DROP CONSTRAINT IF EXISTS tabla_base_de_datos_id_fkey;
ALTER TABLE tabla ADD CONSTRAINT tabla_base_de_datos_id_fkey
  FOREIGN KEY (base_de_datos_id) REFERENCES base_de_datos(id) ON DELETE SET NULL;

-- instrumento.base_de_datos_id
ALTER TABLE instrumento ALTER COLUMN base_de_datos_id DROP NOT NULL;
ALTER TABLE instrumento DROP CONSTRAINT IF EXISTS instrumento_base_de_datos_id_fkey;
ALTER TABLE instrumento ADD CONSTRAINT instrumento_base_de_datos_id_fkey
  FOREIGN KEY (base_de_datos_id) REFERENCES base_de_datos(id) ON DELETE SET NULL;

-- url.instrumento_id
ALTER TABLE url ALTER COLUMN instrumento_id DROP NOT NULL;
ALTER TABLE url DROP CONSTRAINT IF EXISTS url_instrumento_id_fkey;
ALTER TABLE url ADD CONSTRAINT url_instrumento_id_fkey
  FOREIGN KEY (instrumento_id) REFERENCES instrumento(id) ON DELETE SET NULL;

-- archivo.url_id
ALTER TABLE archivo ALTER COLUMN url_id DROP NOT NULL;
ALTER TABLE archivo DROP CONSTRAINT IF EXISTS archivo_url_id_fkey;
ALTER TABLE archivo ADD CONSTRAINT archivo_url_id_fkey
  FOREIGN KEY (url_id) REFERENCES url(id) ON DELETE SET NULL;
