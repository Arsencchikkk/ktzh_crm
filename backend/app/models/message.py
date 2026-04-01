from datetime import datetime
from enum import Enum
from pydantic import Field
from app.models.base import MongoBaseModel, PyObjectId


class MessageDirection(str, Enum):
    INBOUND = "inbound"   # from passenger
    OUTBOUND = "outbound" # from operator


class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class Message(MongoBaseModel):
    conversation_id: PyObjectId
    contact_id: PyObjectId
    direction: MessageDirection
    text: str | None = None
    media_url: str | None = None
    media_type: str | None = None
    status: MessageStatus = MessageStatus.SENT
    wazzup_message_id: str | None = None   # external ID from Wazzup
    sent_by: PyObjectId | None = None       # operator user._id (for outbound)
    created_at: datetime = Field(default_factory=datetime.utcnow)
