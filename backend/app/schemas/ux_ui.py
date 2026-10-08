from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UXUICaseStudyCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    category: str = Field(default="Web Application", max_length=100)
    client: Optional[str] = Field(default=None, max_length=200)
    role: Optional[str] = Field(default=None, max_length=200)
    duration: Optional[str] = Field(default=None, max_length=100)
    tools_used: Optional[str] = Field(default=None, max_length=300)
    cover_image_url: str = Field(min_length=1, max_length=500)
    preview_image_url: Optional[str] = Field(default=None, max_length=500)
    problem_statement: Optional[str] = None
    solution_overview: Optional[str] = None
    design_process: Optional[str] = None
    key_results: Optional[str] = None
    figma_url: Optional[str] = Field(default=None, max_length=500)
    live_prototype_url: Optional[str] = Field(default=None, max_length=500)
    display_order: int = 0
    is_featured: bool = False
    is_active: bool = True


class UXUICaseStudyUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    category: Optional[str] = Field(default=None, max_length=100)
    client: Optional[str] = Field(default=None, max_length=200)
    role: Optional[str] = Field(default=None, max_length=200)
    duration: Optional[str] = Field(default=None, max_length=100)
    tools_used: Optional[str] = Field(default=None, max_length=300)
    cover_image_url: Optional[str] = Field(default=None, min_length=1, max_length=500)
    preview_image_url: Optional[str] = Field(default=None, max_length=500)
    problem_statement: Optional[str] = None
    solution_overview: Optional[str] = None
    design_process: Optional[str] = None
    key_results: Optional[str] = None
    figma_url: Optional[str] = Field(default=None, max_length=500)
    live_prototype_url: Optional[str] = Field(default=None, max_length=500)
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class UXUICaseStudyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    subtitle: Optional[str] = None
    category: str
    client: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    tools_used: Optional[str] = None
    cover_image_url: str
    preview_image_url: Optional[str] = None
    problem_statement: Optional[str] = None
    solution_overview: Optional[str] = None
    design_process: Optional[str] = None
    key_results: Optional[str] = None
    figma_url: Optional[str] = None
    live_prototype_url: Optional[str] = None
    display_order: int
    is_featured: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
