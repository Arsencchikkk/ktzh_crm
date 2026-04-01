from datetime import datetime
from pydantic import BaseModel
from app.models.case import CaseStatus, CasePriority


class CaseCreate(BaseModel):
    conversation_id: str
    contact_id: str
    title: str | None = None
    description: str | None = None
    priority: CasePriority = CasePriority.MEDIUM
    category: str | None = None


class CaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: CaseStatus | None = None
    priority: CasePriority | None = None
    category: str | None = None
    assigned_to: str | None = None


class CaseResponse(BaseModel):
    id: str
    conversation_id: str
    contact_id: str
    title: str | None = None
    description: str | None = None
    status: CaseStatus
    priority: CasePriority
    category: str | None = None
    assigned_to: str | None = None
    assigned_operator_name: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
