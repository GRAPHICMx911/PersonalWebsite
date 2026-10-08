from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class SocialLinkCreate(BaseModel):
    platform_name: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=3, max_length=500)
    icon_svg: Optional[str] = Field(default=None)
    icon_class: Optional[str] = Field(default=None, max_length=100)
    display_order: int = 0
    is_active: bool = True


class SocialLinkUpdate(BaseModel):
    platform_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    url: Optional[str] = Field(default=None, min_length=3, max_length=500)
    icon_svg: Optional[str] = Field(default=None)
    icon_class: Optional[str] = Field(default=None, max_length=100)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class SocialLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    platform_name: str
    url: str
    icon_svg: Optional[str] = None
    icon_class: Optional[str] = None
    display_order: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SocialLinkReorderItem(BaseModel):
    id: int
    display_order: int


class SocialLinkReorderRequest(BaseModel):
    items: List[SocialLinkReorderItem]
