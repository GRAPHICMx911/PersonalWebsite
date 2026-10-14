import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.setting import SiteSetting
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.setting import (
    SiteSettingsUpdate,
    SiteSettingsResponse,
    SiteSettingsPublic,
)

router = APIRouter(
    prefix="/api/settings",
    tags=["Website Settings & Profile CMS"],
)

DOCS_UPLOAD_DIR = Path("frontend/uploads/documents")
AVATARS_UPLOAD_DIR = Path("frontend/uploads/avatars")
DOCS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
AVATARS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_or_create_settings(db: Session) -> SiteSetting:
    """Helper to ensure exactly one singleton settings record exists."""
    setting = db.scalars(select(SiteSetting).limit(1)).first()
    if not setting:
        setting = SiteSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=SiteSettingsPublic,
    summary="Get Public Website Settings and Metadata",
)
def get_public_settings(
    db: Session = Depends(get_db),
):
    """Retrieve public portfolio profile, hero texts, metadata, and status."""
    return get_or_create_settings(db)


# =========================================================
# ADMIN ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=SiteSettingsResponse,
    summary="Admin Get All Website Settings",
)
def admin_get_settings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve full configuration settings for CMS."""
    return get_or_create_settings(db)


@router.put(
    "",
    response_model=SiteSettingsResponse,
    summary="Admin Update Website Settings",
)
def admin_update_settings(
    payload: SiteSettingsUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update profile details, hero content, SEO metadata, or availability."""
    setting = get_or_create_settings(db)

    # General Profile
    if payload.full_name is not None:
        setting.full_name = payload.full_name.strip()
    if payload.professional_title is not None:
        setting.professional_title = payload.professional_title.strip()
    if payload.bio_summary is not None:
        setting.bio_summary = payload.bio_summary.strip()
    if payload.avatar_image_url is not None:
        setting.avatar_image_url = payload.avatar_image_url.strip()
    if payload.contact_email is not None:
        setting.contact_email = payload.contact_email.strip().lower()
    if payload.location is not None:
        setting.location = payload.location.strip()
    if payload.resume_download_url is not None:
        setting.resume_download_url = payload.resume_download_url.strip()

    # Hero Section
    if payload.hero_pill_text is not None:
        setting.hero_pill_text = payload.hero_pill_text.strip()
    if payload.hero_title_prefix is not None:
        setting.hero_title_prefix = payload.hero_title_prefix.strip()
    if payload.hero_title_highlight is not None:
        setting.hero_title_highlight = payload.hero_title_highlight.strip()
    if payload.hero_description is not None:
        setting.hero_description = payload.hero_description.strip()
    if payload.hero_primary_btn_text is not None:
        setting.hero_primary_btn_text = payload.hero_primary_btn_text.strip()
    if payload.hero_primary_btn_url is not None:
        setting.hero_primary_btn_url = payload.hero_primary_btn_url.strip()
    if payload.hero_secondary_btn_text is not None:
        setting.hero_secondary_btn_text = payload.hero_secondary_btn_text.strip()
    if payload.hero_secondary_btn_url is not None:
        setting.hero_secondary_btn_url = payload.hero_secondary_btn_url.strip()

    # SEO & Meta
    if payload.meta_title is not None:
        setting.meta_title = payload.meta_title.strip()
    if payload.meta_description is not None:
        setting.meta_description = payload.meta_description.strip()
    if payload.meta_keywords is not None:
        setting.meta_keywords = payload.meta_keywords.strip()
    if payload.og_image_url is not None:
        setting.og_image_url = payload.og_image_url.strip()

    # Availability
    if payload.is_hiring_available is not None:
        setting.is_hiring_available = payload.is_hiring_available
    if payload.availability_badge_text is not None:
        setting.availability_badge_text = payload.availability_badge_text.strip()

    setting.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(setting)
    return setting


@router.post(
    "/upload-resume",
    summary="Admin Upload Resume / CV File",
)
async def admin_upload_resume(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Upload PDF or document resume, update resume_download_url, and return relative URL."""
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".docx", ".doc"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed extensions: {', '.join(allowed_exts)}",
        )

    filename = f"resume_{uuid.uuid4().hex[:8]}{ext}"
    filepath = DOCS_UPLOAD_DIR / filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_url = f"/uploads/documents/{filename}"

    setting = get_or_create_settings(db)
    setting.resume_download_url = relative_url
    setting.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "url": relative_url,
        "filename": filename,
    }


ROLE_FILE_MAP = {
    "fullstack": "cv_fullstack_engineer.pdf",
    "uiux": "cv_uiux_designer.pdf",
    "cloud": "cv_cloud_architect.pdf",
    "cyber": "cv_cybersecurity_specialist.pdf",
    "graphic": "cv_graphic_designer.pdf",
}

ROLE_INFO_MAP = {
    "fullstack": {"title": "Full-Stack Software Engineer", "category": "Software Engineering & APIs"},
    "uiux": {"title": "UI / UX & Product Designer", "category": "Product Design & Prototyping"},
    "cloud": {"title": "Cloud Solutions Architect & DevOps", "category": "Cloud Infrastructure & DevOps"},
    "cyber": {"title": "Cybersecurity & Network Specialist", "category": "Security & Network Defense"},
    "graphic": {"title": "Graphic Designer & Creative Lead", "category": "Graphic Design & Brand Identity"},
}


@router.get(
    "/cvs",
    summary="Get List of Tailored CV Documents by Post",
)
def get_tailored_cvs():
    """Returns list of tailored CV documents by post."""
    DOCS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    cv_list = []
    for key, filename in ROLE_FILE_MAP.items():
        filepath = DOCS_UPLOAD_DIR / filename
        info = ROLE_INFO_MAP.get(key, {})
        cv_list.append({
            "role_key": key,
            "title": info.get("title", key.title()),
            "category": info.get("category", "General"),
            "filename": filename,
            "url": f"/uploads/documents/{filename}",
            "exists": filepath.exists(),
            "size_bytes": filepath.stat().st_size if filepath.exists() else 0,
        })
    return cv_list


@router.post(
    "/upload-cv/{role_key}",
    summary="Admin Upload / Replace CV by Specific Post",
)
async def admin_upload_cv_by_role(
    role_key: str,
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """Upload or replace a tailored PDF CV for a specific job post."""
    role_key = role_key.lower().strip()
    if role_key not in ROLE_FILE_MAP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role key '{role_key}'. Allowed roles: {', '.join(ROLE_FILE_MAP.keys())}",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Only PDF documents (.pdf) are permitted for CVs.",
        )

    target_filename = ROLE_FILE_MAP[role_key]
    filepath = DOCS_UPLOAD_DIR / target_filename
    DOCS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_url = f"/uploads/documents/{target_filename}"
    file_size = filepath.stat().st_size

    return {
        "status": "success",
        "message": f"Successfully updated CV for {ROLE_INFO_MAP[role_key]['title']}.",
        "role_key": role_key,
        "filename": target_filename,
        "url": relative_url,
        "size_bytes": file_size,
    }



@router.post(
    "/upload-avatar",
    summary="Admin Upload Profile Avatar Image",
)
async def admin_upload_avatar(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Upload profile photo or avatar image, update avatar_image_url, and return relative URL."""
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".png", ".jpg", ".jpeg", ".webp", ".svg"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type '{ext}'. Allowed extensions: {', '.join(allowed_exts)}",
        )

    filename = f"avatar_{uuid.uuid4().hex[:8]}{ext}"
    filepath = AVATARS_UPLOAD_DIR / filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_url = f"/uploads/avatars/{filename}"

    setting = get_or_create_settings(db)
    setting.avatar_image_url = relative_url
    setting.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": "success",
        "url": relative_url,
        "filename": filename,
    }
