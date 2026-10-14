from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CVDocumentCreate(BaseModel):
    role_key: Optional[str] = Field(default=None, max_length=50)
    title: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=100)
    target_role: Optional[str] = Field(default=None, max_length=150)
    description: str = Field(min_length=5)
    bullets: Optional[str] = Field(default=None)
    tags: Optional[str] = Field(default=None, max_length=300)
    file_url: str = Field(min_length=1, max_length=500)
    file_name: str = Field(min_length=1, max_length=200)
    icon: str = Field(default="💻", max_length=50)
    display_order: int = 0
    is_active: bool = True


class CVDocumentUpdate(BaseModel):
    role_key: Optional[str] = Field(default=None, max_length=50)
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    target_role: Optional[str] = Field(default=None, max_length=150)
    description: Optional[str] = Field(default=None, min_length=5)
    bullets: Optional[str] = Field(default=None)
    tags: Optional[str] = Field(default=None, max_length=300)
    file_url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    file_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    icon: Optional[str] = Field(default=None, max_length=50)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CVDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_key: Optional[str] = None
    title: str
    category: str
    target_role: Optional[str] = None
    description: str
    bullets: Optional[str] = None
    tags: Optional[str] = None
    file_url: str
    file_name: str
    icon: str
    display_order: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
