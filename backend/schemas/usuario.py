import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

from schemas.rol import RolRead


class UsuarioCreate(BaseModel):
    correo: str
    nombre: str | None = None
    rol_id: uuid.UUID | None = None


class UsuarioSignup(BaseModel):
    correo: str
    nombre: str
    password: str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "UsuarioSignup":
        if self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden")
        return self


class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    rol_id: uuid.UUID | None = None
    activo: bool | None = None


class UsuarioRead(BaseModel):
    id: uuid.UUID
    nombre: str | None = None
    correo: str
    activo: bool
    rol_id: uuid.UUID | None = None
    rol: RolRead | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
