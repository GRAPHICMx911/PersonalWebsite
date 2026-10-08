import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.experience import Experience
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.experience import (
    ExperienceCreate,
    ExperienceUpdate,
    ExperienceResponse,
)

router = APIRouter(
    prefix="/api/experience",
    tags=["Career Experience"],
)

# Upload directory
EXP_UPLOAD_DIR = Path("frontend/uploads/experience")
EXP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[ExperienceResponse],
    summary="List Active Career Experiences for Public Portfolio",
)
def get_public_experiences(
    search: Optional[str] = Query(None, description="Search by company, position, or technologies"),
    db: Session = Depends(get_db),
):
    """Retrieve all active work experience milestones for public timeline viewing."""
    statement = (
        select(Experience)
        .where(Experience.is_active == True)
    )

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Experience.company.ilike(search_pattern),
                Experience.position.ilike(search_pattern),
                Experience.technologies.ilike(search_pattern),
                Experience.description.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Experience.display_order.asc(),
        Experience.created_at.desc(),
    )

    experiences = db.scalars(statement).all()
    return experiences


@router.get(
    "/public/{experience_id}",
    response_model=ExperienceResponse,
    summary="Get Single Public Experience Details",
)
def get_public_experience(experience_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a single active work experience."""
    exp = db.get(Experience, experience_id)
    if not exp or not exp.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experience with ID {experience_id} not found or inactive",
        )
    return exp


# =========================================================
# ADMIN CRUD ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[ExperienceResponse],
    summary="Admin List All Career Experiences",
)
def admin_list_experiences(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by keyword"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all career experience records (including drafts and inactive)."""
    statement = select(Experience)

    if is_active is not None:
        statement = statement.where(Experience.is_active == is_active)

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Experience.company.ilike(search_pattern),
                Experience.position.ilike(search_pattern),
                Experience.technologies.ilike(search_pattern),
                Experience.location.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Experience.display_order.asc(),
        Experience.created_at.desc(),
    )

    experiences = db.scalars(statement).all()
    return experiences


@router.post(
    "",
    response_model=ExperienceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Career Experience",
)
def admin_create_experience(
    payload: ExperienceCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a new career experience entry."""
    new_exp = Experience(
        company=payload.company.strip(),
        position=payload.position.strip(),
        employment_type=payload.employment_type.strip() if payload.employment_type else "Full-time",
        location=payload.location.strip() if payload.location else None,
        start_date=payload.start_date.strip(),
        end_date=payload.end_date.strip() if payload.end_date else None,
        is_current=payload.is_current,
        description=payload.description.strip() if payload.description else None,
        technologies=payload.technologies.strip() if payload.technologies else None,
        company_url=payload.company_url.strip() if payload.company_url else None,
        company_logo_url=payload.company_logo_url.strip() if payload.company_logo_url else None,
        display_order=payload.display_order,
        is_active=payload.is_active,
    )

    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return new_exp


@router.get(
    "/{experience_id}",
    response_model=ExperienceResponse,
    summary="Admin Get Experience Details",
)
def admin_get_experience(
    experience_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific career experience."""
    exp = db.get(Experience, experience_id)
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experience with ID {experience_id} not found",
        )
    return exp


@router.put(
    "/{experience_id}",
    response_model=ExperienceResponse,
    summary="Admin Update Experience",
)
def admin_update_experience(
    experience_id: int,
    payload: ExperienceUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing career milestone."""
    exp = db.get(Experience, experience_id)
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experience with ID {experience_id} not found",
        )

    if payload.company is not None:
        exp.company = payload.company.strip()
    if payload.position is not None:
        exp.position = payload.position.strip()
    if payload.employment_type is not None:
        exp.employment_type = payload.employment_type.strip()
    if payload.location is not None:
        exp.location = payload.location.strip() if payload.location else None
    if payload.start_date is not None:
        exp.start_date = payload.start_date.strip()
    if payload.end_date is not None:
        exp.end_date = payload.end_date.strip() if payload.end_date else None
    if payload.is_current is not None:
        exp.is_current = payload.is_current
    if payload.description is not None:
        exp.description = payload.description.strip() if payload.description else None
    if payload.technologies is not None:
        exp.technologies = payload.technologies.strip() if payload.technologies else None
    if payload.company_url is not None:
        exp.company_url = payload.company_url.strip() if payload.company_url else None
    if payload.company_logo_url is not None:
        exp.company_logo_url = payload.company_logo_url.strip() if payload.company_logo_url else None
    if payload.display_order is not None:
        exp.display_order = payload.display_order
    if payload.is_active is not None:
        exp.is_active = payload.is_active

    exp.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(exp)
    return exp


@router.delete(
    "/{experience_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Experience",
)
def admin_delete_experience(
    experience_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete a career experience entry."""
    exp = db.get(Experience, experience_id)
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experience with ID {experience_id} not found",
        )

    db.delete(exp)
    db.commit()
    return {
        "success": True,
        "message": f"Experience at '{exp.company}' ({exp.position}) successfully deleted.",
    }


# =========================================================
# LOGO UPLOAD ENDPOINT
# =========================================================

@router.post(
    "/upload-logo",
    summary="Admin Upload Company Logo",
)
async def upload_company_logo(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """Upload a company logo or organization emblem."""
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{file_ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    destination_path = EXP_UPLOAD_DIR / unique_filename

    try:
        contents = await file.read()
        with open(destination_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save logo file: {str(e)}",
        )

    image_url = f"/uploads/experience/{unique_filename}"
    return {
        "success": True,
        "filename": unique_filename,
        "image_url": image_url,
    }
