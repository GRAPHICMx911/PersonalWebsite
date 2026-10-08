from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, EmailStr


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=5, max_length=5000)


class ContactMessageUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None


class ContactMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    subject: str
    message: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_read: bool
    is_archived: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ContactMessageStats(BaseModel):
    total: int
    unread: int
    read: int
    archived: int
