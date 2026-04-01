from datetime import datetime
from pydantic import BaseModel
from app.models.conversation import ConversationStatus
from app.schemas.contact import ContactResponse


class ConversationResponse(BaseModel):
    id: str
    contact_id: str
    contact: ContactResponse | None = None
    channel_id: str
    channel_type: str
    status: ConversationStatus
    last_message_text: str | None = None
    last_message_at: datetime | None = None
    unread_count: int
    assigned_to: str | None = None
    assigned_operator_name: str | None = None
    created_at: datetime
    updated_at: datetime


class ConversationUpdate(BaseModel):
    status: ConversationStatus | None = None
    assigned_to: str | None = None
