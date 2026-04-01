from datetime import datetime
from enum import Enum
from pydantic import Field
from app.models.base import MongoBaseModel, PyObjectId


class CaseStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    RESOLVED = "resolved"
    CLOSED = "closed"


class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Case(MongoBaseModel):
    conversation_id: PyObjectId
    contact_id: PyObjectId
    title: str | None = None
    description: str | None = None
    status: CaseStatus = CaseStatus.NEW
    priority: CasePriority = CasePriority.MEDIUM
    category: str | None = None            # e.g. "ticket", "refund", "delay"
    assigned_to: PyObjectId | None = None  # operator user._id
    resolved_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
