# Referencia de comandos `just`

Todos los comandos se ejecutan desde la raíz del repositorio.
Para ver la lista rápida: `just` (sin argumentos).

---

## Desarrollo

Comandos para trabajar localmente. Requieren conda env `dashboard` activo, Node.js 20+ y Docker corriendo.

| Comando | Cuándo usarlo |
|---|---|
| `just dev` | Levantar backend y frontend cuando la BD ya tiene datos. |
| `just dev-seed` | Primera vez o cuando quieres resetear con datos dummy completos. |
| `just dev-init` | Primera vez sin datos dummy: solo aplica migraciones y crea el superadmin. |
| `just dev-stop` | Detener backend y frontend locales. |
| `just dev-status` | Ver si backend, frontend y DB están corriendo. |
| `just dev-roles` | Consultar emails y contraseñas de los usuarios dummy. |

---

## Base de datos (desarrollo)

| Comando | Cuándo usarlo |
|---|---|
| `just db-migrate` | Aplicar migraciones pendientes sin tocar los datos existentes. |
| `just db-clean` | Borrar todo el schema y volver a aplicar migraciones desde cero. Los datos se pierden. |
| `just db-reset` | Equivalente a `db-clean` + `dev-seed`: reset completo con datos dummy. |
| `just db-dump [archivo]` | Hacer un backup de la BD de desarrollo. Si no se pasa nombre, genera uno con timestamp. |
| `just db-insert <archivo>` | Restaurar un backup en la BD de desarrollo. |

---

## Alembic

Comandos para gestionar migraciones con Alembic. Documentación completa en [alembic.md](alembic.md).

| Comando | Cuándo usarlo |
|---|---|
| `just alembic-current` | Ver en qué revisión está la BD. |
| `just alembic-history` | Ver el historial de migraciones. |
| `just alembic-check` | Verificar si hay cambios en los modelos sin migración. |
| `just alembic-revision "mensaje"` | Generar una nueva migración a partir de los modelos. |
| `just alembic-upgrade <rev>` | Migrar a una revisión específica. |
| `just alembic-downgrade` | Revertir la última migración. |
| `just alembic-downgrade-to <rev>` | Revertir a una revisión específica. |
| `just alembic-stamp <rev>` | Marcar una revisión como aplicada sin ejecutar DDL. |

---

## Producción

Requieren `deploy/.env.prod` con todas las variables configuradas.

### Cuándo usar cada comando de deploy

```
¿Cambió el código (UI, lógica, rutas)?
  └─ Sin cambio de schema → just prod-deploy
  └─ Con nueva migración SQL → just prod-migrate

¿Es el primer deploy o necesitas un reset total?
  └─ just prod   ⚠️  destruye todos los datos
```

| Comando | Qué hace | Destruye datos |
|---|---|---|
| `just prod` | Construye imágenes + levanta servicios + aplica **todas** las migraciones + crea superadmin. | Sí, si hay migraciones nuevas que hacen DROP. |
| `just prod-deploy` | Reconstruye backend y frontend. No toca la BD ni corre migraciones. | No |
| `just prod-migrate` | Aplica solo las migraciones pendientes (las ya aplicadas se saltan). | Solo si la migración hace DROP explícito. |
| `just prod-stop` | Detiene y elimina los contenedores. El volumen de datos persiste. | No |

### Base de datos de producción

| Comando | Cuándo usarlo |
|---|---|
| `just db-shell-prod` | Abrir psql directamente contra la BD de producción. |
| `just db-dump-prod [archivo]` | Hacer un backup antes de cualquier cambio de schema. |
| `just db-insert-prod <archivo>` | Restaurar un backup en producción. |

---

## Logs

| Comando | Descripción |
|---|---|
| `just logs` | Sigue los logs de backend y frontend en desarrollo (`/tmp/dashboard-*.log`). |
| `just logs-prod` | Sigue los logs de todos los contenedores en producción. |

---

## Flujos comunes

### Primer setup en desarrollo

```bash
cp deploy/.env.example deploy/.env
just dev-seed
```

### Nuevo día de trabajo (datos ya existen)

```bash
just dev
```

### Agregar una migración en desarrollo

```bash
# modificar el modelo en backend/models/
just alembic-revision "add new column"
just db-migrate
just alembic-check         # verificar que no quedan diffs
```

### Deploy de un cambio de UI a producción

```bash
# local
git push origin main

# servidor
git pull origin main
just prod-deploy
```

### Deploy de un nuevo schema a producción

```bash
# local: generar y commitear la migración
just alembic-revision "add new column"
git push origin main

# servidor
git pull origin main
just db-dump-prod          # backup antes de migrar
just prod-migrate          # aplica solo migraciones pendientes
```

### Reset total de producción (primer deploy o emergencia)

```bash
just db-dump-prod          # backup por si acaso
just prod-stop
# eliminar el volumen si es necesario:
# docker volume rm <nombre>_pgdata
just prod
```
