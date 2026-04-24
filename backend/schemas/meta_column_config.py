from pydantic import BaseModel


class MetaColumnConfigRead(BaseModel):
    entity_type: str
    config: dict

    model_config = {"from_attributes": True}


class MetaColumnConfigUpdate(BaseModel):
    config: dict
