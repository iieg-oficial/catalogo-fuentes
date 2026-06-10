from pydantic import BaseModel, model_validator


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden")
        if len(self.new_password) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return self


class UpdateProfileRequest(BaseModel):
    nombre: str
