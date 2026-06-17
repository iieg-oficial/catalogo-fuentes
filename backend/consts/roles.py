SUPERADMIN = "superadmin"
ADMIN = "admin"
MAINTAINER = "maintainer"
VIEWER = "viewer"

# Jerarquía de roles (mayor número = más privilegios).
# Solo se puede asignar un rol estrictamente menor al propio.
ROLE_RANK = {
    SUPERADMIN: 3,
    ADMIN: 2,
    MAINTAINER: 1,
    VIEWER: 0,
}
