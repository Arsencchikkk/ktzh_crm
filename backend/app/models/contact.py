from datetime import datetime
from pydantic import Field
from app.models.base import MongoBaseModel


class Contact(MongoBaseModel):
    phone: str                    # +77001234567 (WhatsApp phone)
    name: str | None = None
    email: str | None = None
    notes: str | None = None
    wazzup_contact_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
