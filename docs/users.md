# Usuarios y permisos

## Roles

| Rol | Descripcion |
|---|---|
| superadmin | Control total del sistema |
| admin | Administracion de usuarios y catalogo |
| maintainer | Edicion del catalogo |
| viewer | Solo lectura |

## Permisos

| Permiso | Descripcion | Roles |
|---|---|---|
| `catalog:read` | Leer el catalogo de datos | viewer, maintainer, admin, superadmin |
| `catalog:write` | Crear, editar y eliminar entidades del catalogo | maintainer, admin, superadmin |
| `users:manage` | Gestionar usuarios (crear, editar rol, activar/desactivar) | admin, superadmin |
| `admin:full` | Acceso completo de administracion (configuracion del sistema) | superadmin |

## Acceso por seccion

| Seccion | Permiso requerido | Lectura | Escritura |
|---|---|---|---|
| Catalogo (proyectos, productos, fuentes, datasets, etc.) | `catalog:read` / `catalog:write` | viewer+ | maintainer+ |
| Usuarios (`/usuarios`) | `users:manage` | admin+ | admin+ |
| Roles y permisos | `users:manage` | admin+ | Solo BD (ver issue #31) |

## Usuarios de desarrollo (seed)

| Correo | Rol | Password |
|---|---|---|
| superadmin@iieg.gob.mx | superadmin | Super1234! |
| admin@iieg.gob.mx | admin | Admin1234! |
| editor@iieg.gob.mx | maintainer | Editor1234! |
| consulta@iieg.gob.mx | viewer | Viewer1234! |

## Como funciona

La autorizacion se basa en la tabla `permiso_rol` (relacion muchos a muchos entre `rol` y `permiso`). Cuando un usuario se autentica:

1. El backend carga `usuario.rol.permisos` via `selectinload`
2. El schema `UsuarioRead` incluye `permisos: list[str]` con los nombres de los permisos
3. El frontend recibe `permisos: ["catalog:read", "catalog:write", ...]` y los usa en `AuthContext` para controlar visibilidad de UI
4. El backend valida permisos en cada endpoint via `require_permisos()` en `dependencies.py`

Para cambiar los permisos de un rol, modificar la tabla `permiso_rol` en la BD. La UI para esto esta pendiente (issue #31).
