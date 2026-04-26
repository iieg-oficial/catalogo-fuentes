import uuid

from pydantic import BaseModel, EmailStr, model_validator

from models.user import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.visualizer


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

    @model_validator(mode='after')
    def passwords_match(self) -> 'UserSignup':
        if self.password != self.confirm_password:
            raise ValueError('Las contraseñas no coinciden')
        return self


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}
