import uuid

from pydantic import BaseModel


class ClientBase(BaseModel):
    name: str


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: str | None = None


class ClientRead(ClientBase):
    id: uuid.UUID

    class Config:
        from_attributes = True
