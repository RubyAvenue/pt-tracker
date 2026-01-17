from datetime import date, datetime
import uuid
from typing import Any

from pydantic import BaseModel


class SessionBase(BaseModel):
    session_date: date
    status: str | None = None
    notes: str | None = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    session_date: date | None = None
    status: str | None = None
    notes: str | None = None


class SessionRead(SessionBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionItemBase(BaseModel):
    name: str
    order_index: int | None = None
    planned_weight: float | None = None
    planned_reps: int | None = None
    planned_sets: int | None = None
    actual_weight: float | None = None
    actual_reps: int | None = None
    actual_sets: int | None = None
    notes: str | None = None
    metrics: dict[str, Any] | None = None


class SessionItemCreate(SessionItemBase):
    pass


class SessionItemUpdate(BaseModel):
    name: str | None = None
    order_index: int | None = None
    planned_weight: float | None = None
    planned_reps: int | None = None
    planned_sets: int | None = None
    actual_weight: float | None = None
    actual_reps: int | None = None
    actual_sets: int | None = None
    notes: str | None = None
    metrics: dict[str, Any] | None = None


class SessionItemRead(SessionItemBase):
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionReadWithItems(SessionRead):
    items: list[SessionItemRead] = []
