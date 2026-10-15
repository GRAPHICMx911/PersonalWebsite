import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.certification import Certification
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.certification import (
    CertificationCreate,
    CertificationUpdate,
    CertificationResponse,
)

router = APIRouter(
    prefix="/api/certifications",
    tags=["Certifications"],
)

# Upload directory
CERT_UPLOAD_DIR = Path("frontend/uploads/certifications")
try:
    CERT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[CertificationResponse],
    summary="List Active Certifications for Public Portfolio",
)
def get_public_certifications(
    search: Optional[str] = Query(None, description="Search by name, organization, or credential ID"),
    db: Session = Depends(get_db),
):
    """Retrieve all active certifications for public viewing."""
    statement = (
        select(Certification)
        .where(Certification.is_active == True)
    )

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Certification.name.ilike(search_pattern),
                Certification.issuing_organization.ilike(search_pattern),
                Certification.credential_id.ilike(search_pattern),
                Certification.description.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Certification.display_order.asc(),
        Certification.created_at.desc(),
    )

    certifications = db.scalars(statement).all()
    return certifications


@router.get(
    "/featured",
    response_model=List[CertificationResponse],
    summary="List Featured Certifications",
)
def get_featured_certifications(db: Session = Depends(get_db)):
    """Retrieve featured credentials for homepage highlighting."""
    statement = (
        select(Certification)
        .where(Certification.is_featured == True, Certification.is_active == True)
        .order_by(Certification.display_order.asc(), Certification.created_at.desc())
    )
    certifications = db.scalars(statement).all()
    return certifications


@router.get(
    "/public/{cert_id}",
    response_model=CertificationResponse,
    summary="Get Single Public Certification Details",
)
def get_public_certification(cert_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a single active certification for public viewing."""
    cert = db.get(Certification, cert_id)
    if not cert or not cert.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certification with ID {cert_id} not found or inactive",
        )
    return cert


# =========================================================
# ADMIN CRUD ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[CertificationResponse],
    summary="Admin List All Certifications",
)
def admin_list_certifications(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by keyword"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all certifications (including drafts and inactive)."""
    statement = select(Certification)

    if is_active is not None:
        statement = statement.where(Certification.is_active == is_active)

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Certification.name.ilike(search_pattern),
                Certification.issuing_organization.ilike(search_pattern),
                Certification.credential_id.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Certification.display_order.asc(),
        Certification.created_at.desc(),
    )

    certifications = db.scalars(statement).all()
    return certifications


@router.post(
    "",
    response_model=CertificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Certification",
)
def admin_create_certification(
    payload: CertificationCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a new verified credential."""
    new_cert = Certification(
        name=payload.name.strip(),
        issuing_organization=payload.issuing_organization.strip(),
        issue_date=payload.issue_date.strip() if payload.issue_date else None,
        expiry_date=payload.expiry_date.strip() if payload.expiry_date else None,
        credential_id=payload.credential_id.strip() if payload.credential_id else None,
        credential_url=payload.credential_url.strip() if payload.credential_url else None,
        certificate_image_url=payload.certificate_image_url.strip() if payload.certificate_image_url else None,
        description=payload.description.strip() if payload.description else None,
        display_order=payload.display_order,
        is_featured=payload.is_featured,
        is_active=payload.is_active,
    )

    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)
    return new_cert


@router.get(
    "/{cert_id}",
    response_model=CertificationResponse,
    summary="Admin Get Certification Details",
)
def admin_get_certification(
    cert_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific certification."""
    cert = db.get(Certification, cert_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certification with ID {cert_id} not found",
        )
    return cert


@router.put(
    "/{cert_id}",
    response_model=CertificationResponse,
    summary="Admin Update Certification",
)
def admin_update_certification(
    cert_id: int,
    payload: CertificationUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing credential."""
    cert = db.get(Certification, cert_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certification with ID {cert_id} not found",
        )

    if payload.name is not None:
        cert.name = payload.name.strip()
    if payload.issuing_organization is not None:
        cert.issuing_organization = payload.issuing_organization.strip()
    if payload.issue_date is not None:
        cert.issue_date = payload.issue_date.strip() if payload.issue_date else None
    if payload.expiry_date is not None:
        cert.expiry_date = payload.expiry_date.strip() if payload.expiry_date else None
    if payload.credential_id is not None:
        cert.credential_id = payload.credential_id.strip() if payload.credential_id else None
    if payload.credential_url is not None:
        cert.credential_url = payload.credential_url.strip() if payload.credential_url else None
    if payload.certificate_image_url is not None:
        cert.certificate_image_url = payload.certificate_image_url.strip() if payload.certificate_image_url else None
    if payload.description is not None:
        cert.description = payload.description.strip() if payload.description else None
    if payload.display_order is not None:
        cert.display_order = payload.display_order
    if payload.is_featured is not None:
        cert.is_featured = payload.is_featured
    if payload.is_active is not None:
        cert.is_active = payload.is_active

    cert.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete(
    "/{cert_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Certification",
)
def admin_delete_certification(
    cert_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete a certification."""
    cert = db.get(Certification, cert_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certification with ID {cert_id} not found",
        )

    db.delete(cert)
    db.commit()
    return {
        "success": True,
        "message": f"Certification '{cert.name}' (ID: {cert_id}) successfully deleted.",
    }


# =========================================================
# BADGE / CERTIFICATE IMAGE UPLOAD
# =========================================================

@router.post(
    "/upload-badge",
    summary="Admin Upload Badge Image",
)
async def upload_badge_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """Upload a badge or certificate image."""
    allowed_extensions = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".jfif"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{file_ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    destination_path = CERT_UPLOAD_DIR / unique_filename

    try:
        contents = await file.read()
        with open(destination_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save badge file: {str(e)}",
        )

    image_url = f"/uploads/certifications/{unique_filename}"
    return {
        "success": True,
        "filename": unique_filename,
        "image_url": image_url,
    }
