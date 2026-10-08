from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class EducationCreate(BaseModel):
    institution: str = Field(min_length=2, max_length=200)
    degree: str = Field(min_length=2, max_length=200)
    field_of_study: str = Field(min_length=2, max_length=200)
    start_year: Optional[str] = Field(default=None, max_length=50)
    end_year: Optional[str] = Field(default=None, max_length=50)
    grade: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    activities: Optional[str] = Field(default=None, max_length=500)
    institution_url: Optional[str] = Field(default=None, max_length=500)
    institution_logo_url: Optional[str] = Field(default=None, max_length=500)
    display_order: int = 0
    is_active: bool = True


class EducationUpdate(BaseModel):
    institution: Optional[str] = Field(default=None, min_length=2, max_length=200)
    degree: Optional[str] = Field(default=None, min_length=2, max_length=200)
    field_of_study: Optional[str] = Field(default=None, min_length=2, max_length=200)
    start_year: Optional[str] = Field(default=None, max_length=50)
    end_year: Optional[str] = Field(default=None, max_length=50)
    grade: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    activities: Optional[str] = Field(default=None, max_length=500)
    institution_url: Optional[str] = Field(default=None, max_length=500)
    institution_logo_url: Optional[str] = Field(default=None, max_length=500)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class EducationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution: str
    degree: str
    field_of_study: str
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    grade: Optional[str] = None
    description: Optional[str] = None
    activities: Optional[str] = None
    institution_url: Optional[str] = None
    institution_logo_url: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
