import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.education import Education
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.education import (
    EducationCreate,
    EducationUpdate,
    EducationResponse,
)

router = APIRouter(
    prefix="/api/education",
    tags=["Academic Education"],
)

# Upload directory
EDU_UPLOAD_DIR = Path("frontend/uploads/education")
EDU_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[EducationResponse],
    summary="List Active Education Qualifications for Public Portfolio",
)
def get_public_education(
    search: Optional[str] = Query(None, description="Search by institution, degree, or field of study"),
    db: Session = Depends(get_db),
):
    """Retrieve all active education qualifications for public timeline viewing."""
    statement = (
        select(Education)
        .where(Education.is_active == True)
    )

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Education.institution.ilike(search_pattern),
                Education.degree.ilike(search_pattern),
                Education.field_of_study.ilike(search_pattern),
                Education.description.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Education.display_order.asc(),
        Education.created_at.desc(),
    )

    education_records = db.scalars(statement).all()
    return education_records


@router.get(
    "/public/{education_id}",
    response_model=EducationResponse,
    summary="Get Single Public Education Details",
)
def get_public_single_education(education_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a single active education qualification."""
    edu = db.get(Education, education_id)
    if not edu or not edu.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Education with ID {education_id} not found or inactive",
        )
    return edu


# =========================================================
# ADMIN CRUD ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[EducationResponse],
    summary="Admin List All Education Qualifications",
)
def admin_list_education(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by keyword"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all education records (including drafts and inactive)."""
    statement = select(Education)

    if is_active is not None:
        statement = statement.where(Education.is_active == is_active)

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Education.institution.ilike(search_pattern),
                Education.degree.ilike(search_pattern),
                Education.field_of_study.ilike(search_pattern),
                Education.description.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Education.display_order.asc(),
        Education.created_at.desc(),
    )

    education_records = db.scalars(statement).all()
    return education_records


@router.post(
    "",
    response_model=EducationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Education Qualification",
)
def admin_create_education(
    payload: EducationCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a new education qualification entry."""
    new_edu = Education(
        institution=payload.institution.strip(),
        degree=payload.degree.strip(),
        field_of_study=payload.field_of_study.strip(),
        start_year=payload.start_year.strip() if payload.start_year else None,
        end_year=payload.end_year.strip() if payload.end_year else None,
        grade=payload.grade.strip() if payload.grade else None,
        description=payload.description.strip() if payload.description else None,
        activities=payload.activities.strip() if payload.activities else None,
        institution_url=payload.institution_url.strip() if payload.institution_url else None,
        institution_logo_url=payload.institution_logo_url.strip() if payload.institution_logo_url else None,
        display_order=payload.display_order,
        is_active=payload.is_active,
    )

    db.add(new_edu)
    db.commit()
    db.refresh(new_edu)
    return new_edu


@router.get(
    "/{education_id}",
    response_model=EducationResponse,
    summary="Admin Get Education Details",
)
def admin_get_education(
    education_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific education qualification."""
    edu = db.get(Education, education_id)
    if not edu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Education with ID {education_id} not found",
        )
    return edu


@router.put(
    "/{education_id}",
    response_model=EducationResponse,
    summary="Admin Update Education",
)
def admin_update_education(
    education_id: int,
    payload: EducationUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing education qualification."""
    edu = db.get(Education, education_id)
    if not edu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Education with ID {education_id} not found",
        )

    if payload.institution is not None:
        edu.institution = payload.institution.strip()
    if payload.degree is not None:
        edu.degree = payload.degree.strip()
    if payload.field_of_study is not None:
        edu.field_of_study = payload.field_of_study.strip()
    if payload.start_year is not None:
        edu.start_year = payload.start_year.strip() if payload.start_year else None
    if payload.end_year is not None:
        edu.end_year = payload.end_year.strip() if payload.end_year else None
    if payload.grade is not None:
        edu.grade = payload.grade.strip() if payload.grade else None
    if payload.description is not None:
        edu.description = payload.description.strip() if payload.description else None
    if payload.activities is not None:
        edu.activities = payload.activities.strip() if payload.activities else None
    if payload.institution_url is not None:
        edu.institution_url = payload.institution_url.strip() if payload.institution_url else None
    if payload.institution_logo_url is not None:
        edu.institution_logo_url = payload.institution_logo_url.strip() if payload.institution_logo_url else None
    if payload.display_order is not None:
        edu.display_order = payload.display_order
    if payload.is_active is not None:
        edu.is_active = payload.is_active

    edu.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(edu)
    return edu


@router.delete(
    "/{education_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Education",
)
def admin_delete_education(
    education_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete an education record."""
    edu = db.get(Education, education_id)
    if not edu:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Education with ID {education_id} not found",
        )

    db.delete(edu)
    db.commit()
    return {
        "success": True,
        "message": f"Education qualification '{edu.degree} in {edu.field_of_study}' from '{edu.institution}' successfully deleted.",
    }


# =========================================================
# LOGO UPLOAD ENDPOINT
# =========================================================

@router.post(
    "/upload-logo",
    summary="Admin Upload Institution Logo",
)
async def upload_institution_logo(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """Upload an institution logo or university crest."""
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{file_ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    destination_path = EDU_UPLOAD_DIR / unique_filename

    try:
        contents = await file.read()
        with open(destination_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save logo file: {str(e)}",
        )

    image_url = f"/uploads/education/{unique_filename}"
    return {
        "success": True,
        "filename": unique_filename,
        "image_url": image_url,
    }
