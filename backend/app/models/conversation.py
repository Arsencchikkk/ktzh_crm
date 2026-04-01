from datetime import datetime
from enum import Enum
from pydantic import Field
from app.models.base import MongoBaseModel, PyObjectId


class ConversationStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    PENDING = "pending"


class Conversation(MongoBaseModel):
    contact_id: PyObjectId
    channel_id: str                    # Wazzup channel ID
    channel_type: str = "whatsapp"
    status: ConversationStatus = ConversationStatus.OPEN
    last_message_text: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    assigned_to: PyObjectId | None = None   # user._id
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
