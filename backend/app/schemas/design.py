from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DesignItemCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    category: str = Field(default="Graphic Design", max_length=100)
    client: Optional[str] = Field(default=None, max_length=200)
    year: Optional[str] = Field(default=None, max_length=50)
    image_url: str = Field(min_length=1, max_length=500)
    thumbnail_url: Optional[str] = Field(default=None, max_length=500)
    tools_used: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = None
    aspect_ratio: Optional[str] = Field(default="16:9", max_length=20)
    tags: Optional[str] = Field(default=None, max_length=300)
    display_order: int = 0
    is_featured: bool = False
    is_active: bool = True


class DesignItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    category: Optional[str] = Field(default=None, max_length=100)
    client: Optional[str] = Field(default=None, max_length=200)
    year: Optional[str] = Field(default=None, max_length=50)
    image_url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    thumbnail_url: Optional[str] = Field(default=None, max_length=500)
    tools_used: Optional[str] = Field(default=None, max_length=300)
    description: Optional[str] = None
    aspect_ratio: Optional[str] = Field(default=None, max_length=20)
    tags: Optional[str] = Field(default=None, max_length=300)
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class DesignItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    client: Optional[str] = None
    year: Optional[str] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    tools_used: Optional[str] = None
    description: Optional[str] = None
    aspect_ratio: Optional[str] = "16:9"
    tags: Optional[str] = None
    display_order: int
    is_featured: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
