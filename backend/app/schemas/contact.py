from datetime import datetime
from pydantic import BaseModel


class ContactCreate(BaseModel):
    phone: str
    name: str | None = None
    email: str | None = None
    notes: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    notes: str | None = None


class ContactResponse(BaseModel):
    id: str
    phone: str
    name: str | None = None
    email: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
