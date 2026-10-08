from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class CertificationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    issuing_organization: str = Field(min_length=2, max_length=150)
    issue_date: Optional[str] = Field(default=None, max_length=50)
    expiry_date: Optional[str] = Field(default=None, max_length=50)
    credential_id: Optional[str] = Field(default=None, max_length=150)
    credential_url: Optional[str] = Field(default=None, max_length=500)
    certificate_image_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None)
    display_order: int = 0
    is_featured: bool = False
    is_active: bool = True


class CertificationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    issuing_organization: Optional[str] = Field(default=None, min_length=2, max_length=150)
    issue_date: Optional[str] = Field(default=None, max_length=50)
    expiry_date: Optional[str] = Field(default=None, max_length=50)
    credential_id: Optional[str] = Field(default=None, max_length=150)
    credential_url: Optional[str] = Field(default=None, max_length=500)
    certificate_image_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None)
    display_order: Optional[int] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


class CertificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    certificate_image_url: Optional[str] = None
    description: Optional[str] = None
    display_order: int
    is_featured: bool
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
