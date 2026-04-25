CREATE TABLE IF NOT EXISTS meta_column_config (
    entity_type VARCHAR PRIMARY KEY,
    config      JSONB NOT NULL DEFAULT '{}'::jsonb
);
