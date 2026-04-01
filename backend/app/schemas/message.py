from datetime import datetime
from pydantic import BaseModel
from app.models.message import MessageDirection, MessageStatus


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    contact_id: str
    direction: MessageDirection
    text: str | None = None
    media_url: str | None = None
    media_type: str | None = None
    status: MessageStatus
    wazzup_message_id: str | None = None
    sent_by: str | None = None
    created_at: datetime


class SendMessageRequest(BaseModel):
    text: str
