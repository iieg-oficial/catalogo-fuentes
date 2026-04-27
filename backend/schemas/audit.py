from datetime import datetime

from pydantic import BaseModel


class AuditFields(BaseModel):
    updated_at: datetime | None = None
    updated_by_email: str | None = None

    model_config = {"from_attributes": True}
