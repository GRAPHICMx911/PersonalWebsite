from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ExperienceCreate(BaseModel):
    company: str = Field(min_length=2, max_length=200)
    position: str = Field(min_length=2, max_length=200)
    employment_type: str = Field(default="Full-time", max_length=100)
    location: Optional[str] = Field(default=None, max_length=150)
    start_date: str = Field(min_length=2, max_length=60)
    end_date: Optional[str] = Field(default=None, max_length=60)
    is_current: bool = False
    description: Optional[str] = None
    technologies: Optional[str] = Field(default=None, max_length=500)
    company_url: Optional[str] = Field(default=None, max_length=500)
    company_logo_url: Optional[str] = Field(default=None, max_length=500)
    display_order: int = 0
    is_active: bool = True


class ExperienceUpdate(BaseModel):
    company: Optional[str] = Field(default=None, min_length=2, max_length=200)
    position: Optional[str] = Field(default=None, min_length=2, max_length=200)
    employment_type: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=150)
    start_date: Optional[str] = Field(default=None, min_length=2, max_length=60)
    end_date: Optional[str] = Field(default=None, max_length=60)
    is_current: Optional[bool] = None
    description: Optional[str] = None
    technologies: Optional[str] = Field(default=None, max_length=500)
    company_url: Optional[str] = Field(default=None, max_length=500)
    company_logo_url: Optional[str] = Field(default=None, max_length=500)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    position: str
    employment_type: Optional[str] = "Full-time"
    location: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None
    technologies: Optional[str] = None
    company_url: Optional[str] = None
    company_logo_url: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
