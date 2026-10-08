from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SiteSettingsUpdate(BaseModel):
    # General Profile
    full_name: Optional[str] = Field(default=None, max_length=150)
    professional_title: Optional[str] = Field(default=None, max_length=250)
    bio_summary: Optional[str] = None
    avatar_image_url: Optional[str] = Field(default=None, max_length=500)
    contact_email: Optional[str] = Field(default=None, max_length=200)
    location: Optional[str] = Field(default=None, max_length=150)
    resume_download_url: Optional[str] = Field(default=None, max_length=500)

    # Hero Section
    hero_pill_text: Optional[str] = Field(default=None, max_length=200)
    hero_title_prefix: Optional[str] = Field(default=None, max_length=200)
    hero_title_highlight: Optional[str] = Field(default=None, max_length=200)
    hero_description: Optional[str] = None
    hero_primary_btn_text: Optional[str] = Field(default=None, max_length=100)
    hero_primary_btn_url: Optional[str] = Field(default=None, max_length=250)
    hero_secondary_btn_text: Optional[str] = Field(default=None, max_length=100)
    hero_secondary_btn_url: Optional[str] = Field(default=None, max_length=250)

    # SEO & Meta
    meta_title: Optional[str] = Field(default=None, max_length=250)
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = Field(default=None, max_length=500)
    og_image_url: Optional[str] = Field(default=None, max_length=500)

    # Availability & Career Status
    is_hiring_available: Optional[bool] = None
    availability_badge_text: Optional[str] = Field(default=None, max_length=150)


class SiteSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    professional_title: str
    bio_summary: Optional[str] = None
    avatar_image_url: Optional[str] = None
    contact_email: str
    location: Optional[str] = None
    resume_download_url: Optional[str] = None

    hero_pill_text: str
    hero_title_prefix: str
    hero_title_highlight: str
    hero_description: str
    hero_primary_btn_text: str
    hero_primary_btn_url: str
    hero_secondary_btn_text: str
    hero_secondary_btn_url: Optional[str] = None

    meta_title: str
    meta_description: str
    meta_keywords: Optional[str] = None
    og_image_url: Optional[str] = None

    is_hiring_available: bool
    availability_badge_text: str

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SiteSettingsPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    professional_title: str
    bio_summary: Optional[str] = None
    avatar_image_url: Optional[str] = None
    contact_email: str
    location: Optional[str] = None
    resume_download_url: Optional[str] = None

    hero_pill_text: str
    hero_title_prefix: str
    hero_title_highlight: str
    hero_description: str
    hero_primary_btn_text: str
    hero_primary_btn_url: str
    hero_secondary_btn_text: str
    hero_secondary_btn_url: Optional[str] = None

    meta_title: str
    meta_description: str
    meta_keywords: Optional[str] = None
    og_image_url: Optional[str] = None

    is_hiring_available: bool
    availability_badge_text: str
