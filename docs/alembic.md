# Alembic — Migraciones de base de datos

Alembic gestiona las migraciones del schema de la base de datos a partir de los modelos SQLAlchemy.

---

## Comandos

Todos los comandos se ejecutan desde la raíz del repositorio con `just`. Requieren conda env `dashboard` activo y Docker corriendo.

| Comando | Qué hace |
|---|---|
| `just alembic-current` | Muestra la revisión actual de la BD. |
| `just alembic-history` | Muestra el historial completo de migraciones. |
| `just alembic-check` | Verifica si hay cambios en los modelos sin migración. |
| `just alembic-revision "mensaje"` | Genera una nueva migración desde los modelos. |
| `just alembic-upgrade <rev>` | Migra a una revisión específica. |
| `just alembic-downgrade` | Revierte la última migración (pide confirmación). |
| `just alembic-downgrade-to <rev>` | Revierte a una revisión específica (pide confirmación). |
| `just alembic-stamp <rev>` | Marca una revisión como aplicada sin ejecutar DDL. |
| `just db-migrate` | Aplica todas las migraciones pendientes (`upgrade head`). |

---

## Flujos comunes

### Agregar una nueva tabla o columna

```bash
# 1. Modificar o crear el modelo en backend/models/
# 2. Generar la migración
just alembic-revision "add tabla_ejemplo table"

# 3. Revisar el archivo generado en backend/alembic/versions/
# 4. Aplicar
just db-migrate

# 5. Verificar que no quedan diffs
just alembic-check
```

### Revisar el estado de las migraciones

```bash
just alembic-current    # en qué revisión está la BD
just alembic-history    # historial completo
just alembic-check      # hay cambios pendientes?
```

### Revertir una migración

```bash
# Revertir la última
just alembic-downgrade

# Revertir a una revisión específica
just alembic-history                        # buscar el ID
just alembic-downgrade-to <revision_id>
```

---

## Adopción en un servidor existente

Si el servidor ya tiene las tablas creadas (por las migraciones SQL anteriores), solo hay que marcar el baseline sin ejecutar DDL:

```bash
cd backend
alembic stamp 4030e0153505
```

A partir de ahí, `alembic upgrade head` (o `just db-migrate`) aplica solo las migraciones nuevas.

---

## Deploy de un nuevo schema a producción

```bash
# local: generar y commitear la migración
just alembic-revision "add new column"
git push origin main

# servidor
git pull origin main
just db-dump-prod          # backup antes de migrar
just prod-migrate          # aplica solo migraciones pendientes
```

---

## Estructura de archivos

```
backend/
  alembic.ini                  # Configuración de Alembic
  alembic/
    env.py                     # Conexión async + carga de modelos
    script.py.mako             # Template para nuevas migraciones
    versions/                  # Archivos de migración
      4030e0153505_baseline_schema.py
```

---

## Naming convention

Los índices y constraints siguen una convención definida en `backend/db.py`:

| Tipo | Formato | Ejemplo |
|---|---|---|
| Index | `idx_<tabla>_<columna>` | `idx_dataset_fuente_id` |
| Unique | `uq_<tabla>_<columna>` | `uq_rol_nombre` |
| Foreign key | `fk_<tabla>_<columna>_<tabla_referida>` | `fk_dataset_fuente_id_fuente` |
| Primary key | `pk_<tabla>` | `pk_dataset` |

Al agregar `index=True` o `unique=True` en un modelo, Alembic genera automáticamente el nombre correcto.
