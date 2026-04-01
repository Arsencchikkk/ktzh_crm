from datetime import datetime
from enum import Enum
from pydantic import Field
from app.models.base import MongoBaseModel


class UserRole(str, Enum):
    OPERATOR = "operator"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"


class User(MongoBaseModel):
    email: str
    hashed_password: str
    full_name: str
    role: UserRole = UserRole.OPERATOR
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
