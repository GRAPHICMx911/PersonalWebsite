from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# SKILL CATEGORY SCHEMAS
# =========================================================

class SkillCategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class SkillCategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class SkillCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# =========================================================
# SKILL SCHEMAS
# =========================================================

class SkillCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category_id: Optional[int] = None
    proficiency: int = Field(default=80, ge=1, le=100)
    proficiency_level: str = Field(default="Advanced", max_length=50)
    icon: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    display_order: int = 0
    is_featured: bool = False
    is_visible: bool = True


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category_id: Optional[int] = None
    proficiency: Optional[int] = Field(default=None, ge=1, le=100)
    proficiency_level: Optional[str] = Field(default=None, max_length=50)
    icon: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_visible: Optional[bool] = None


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: Optional[int] = None
    name: str
    proficiency: int
    proficiency_level: str
    icon: Optional[str] = None
    description: Optional[str] = None
    display_order: int
    is_featured: bool
    is_visible: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category: Optional[SkillCategoryResponse] = None
