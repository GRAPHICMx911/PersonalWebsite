from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BlogPostCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    category: str = Field(default="Software Engineering", max_length=100)
    excerpt: Optional[str] = None
    content: str = Field(min_length=10)
    cover_image_url: Optional[str] = Field(default=None, max_length=500)
    author: str = Field(default="Design Lyricist", max_length=150)
    reading_time_minutes: int = Field(default=5, ge=1, le=120)
    tags: Optional[str] = Field(default=None, max_length=300)
    is_published: bool = False
    is_featured: bool = False


class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    category: Optional[str] = Field(default=None, max_length=100)
    excerpt: Optional[str] = None
    content: Optional[str] = Field(default=None, min_length=10)
    cover_image_url: Optional[str] = Field(default=None, max_length=500)
    author: Optional[str] = Field(default=None, max_length=150)
    reading_time_minutes: Optional[int] = Field(default=None, ge=1, le=120)
    tags: Optional[str] = Field(default=None, max_length=300)
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None


class BlogPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    subtitle: Optional[str] = None
    category: str
    excerpt: Optional[str] = None
    content: str
    cover_image_url: Optional[str] = None
    author: str
    reading_time_minutes: int
    tags: Optional[str] = None
    views_count: int
    is_published: bool
    is_featured: bool
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
