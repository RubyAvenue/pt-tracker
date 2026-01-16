import uuid
from datetime import datetime

from pydantic import BaseModel


class InviteCreate(BaseModel):
    expires_at: datetime | None = None


class InviteRead(BaseModel):
    id: uuid.UUID
    code: str
    created_by_user_id: uuid.UUID
    used_by_user_id: uuid.UUID | None = None
    expires_at: datetime | None = None
    used_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
