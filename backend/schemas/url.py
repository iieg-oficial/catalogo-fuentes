import uuid

from pydantic import BaseModel

from schemas.instrumento import InstrumentoRead


class UrlBase(BaseModel):
    instrumento_id: uuid.UUID
    url: str
    meta: dict = {}


class UrlCreate(UrlBase):
    pass


class UrlUpdate(BaseModel):
    instrumento_id: uuid.UUID | None = None
    url: str | None = None
    meta: dict | None = None


class UrlRead(UrlBase):
    id: uuid.UUID
    instrumento: InstrumentoRead | None = None

    model_config = {"from_attributes": True}


class UrlDetail(UrlRead):
    pass
