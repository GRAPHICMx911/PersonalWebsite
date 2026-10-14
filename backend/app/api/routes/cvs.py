import os
import uuid
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.cv import CVDocument
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.cv import (
    CVDocumentCreate,
    CVDocumentUpdate,
    CVDocumentResponse,
)

router = APIRouter(
    prefix="/api/cvs",
    tags=["CVs"],
)

DOCS_UPLOAD_DIR = Path("frontend/uploads/documents")
DOCS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[CVDocumentResponse],
    summary="List Active CVs for Public Portfolio",
)
def get_public_cvs(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    """Retrieve all active CV documents ordered by display order."""
    query = select(CVDocument).where(CVDocument.is_active == True)
    if category:
        query = query.where(CVDocument.category == category)
    query = query.order_by(CVDocument.display_order.asc(), CVDocument.id.asc())
    result = db.execute(query).scalars().all()
    return result


# =========================================================
# ADMIN ENDPOINTS (CRUD)
# =========================================================

@router.get(
    "/",
    response_model=List[CVDocumentResponse],
    summary="Admin: List All CV Documents",
)
def admin_list_cvs(
    search: Optional[str] = Query(None, description="Search by title, role or category"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """List all CV documents with optional search."""
    query = select(CVDocument)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.where(
            or_(
                CVDocument.title.ilike(search_filter),
                CVDocument.category.ilike(search_filter),
                CVDocument.target_role.ilike(search_filter),
                CVDocument.tags.ilike(search_filter),
            )
        )
    query = query.order_by(CVDocument.display_order.asc(), CVDocument.id.asc())
    result = db.execute(query).scalars().all()
    return result


@router.get(
    "/{cv_id}",
    response_model=CVDocumentResponse,
    summary="Admin: Get Single CV Document",
)
def admin_get_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Retrieve details of a single CV document by ID."""
    cv = db.get(CVDocument, cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV document with ID {cv_id} not found",
        )
    return cv


@router.post(
    "/",
    response_model=CVDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Create New CV Document",
)
def admin_create_cv(
    payload: CVDocumentCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Create a new CV document record."""
    cv = CVDocument(
        role_key=payload.role_key or f"role_{uuid.uuid4().hex[:6]}",
        title=payload.title.strip(),
        category=payload.category.strip(),
        target_role=payload.target_role.strip() if payload.target_role else None,
        description=payload.description.strip(),
        bullets=payload.bullets.strip() if payload.bullets else None,
        tags=payload.tags.strip() if payload.tags else None,
        file_url=payload.file_url.strip(),
        file_name=payload.file_name.strip(),
        icon=payload.icon.strip() if payload.icon else "💻",
        display_order=payload.display_order,
        is_active=payload.is_active,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


@router.put(
    "/{cv_id}",
    response_model=CVDocumentResponse,
    summary="Admin: Update Existing CV Document",
)
def admin_update_cv(
    cv_id: int,
    payload: CVDocumentUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Update fields of an existing CV document."""
    cv = db.get(CVDocument, cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV document with ID {cv_id} not found",
        )

    if payload.role_key is not None:
        cv.role_key = payload.role_key.strip()
    if payload.title is not None:
        cv.title = payload.title.strip()
    if payload.category is not None:
        cv.category = payload.category.strip()
    if payload.target_role is not None:
        cv.target_role = payload.target_role.strip()
    if payload.description is not None:
        cv.description = payload.description.strip()
    if payload.bullets is not None:
        cv.bullets = payload.bullets.strip()
    if payload.tags is not None:
        cv.tags = payload.tags.strip()
    if payload.file_url is not None:
        cv.file_url = payload.file_url.strip()
    if payload.file_name is not None:
        cv.file_name = payload.file_name.strip()
    if payload.icon is not None:
        cv.icon = payload.icon.strip()
    if payload.display_order is not None:
        cv.display_order = payload.display_order
    if payload.is_active is not None:
        cv.is_active = payload.is_active

    cv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cv)
    return cv


@router.delete(
    "/{cv_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Admin: Delete CV Document",
)
def admin_delete_cv(
    cv_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Delete a CV document record."""
    cv = db.get(CVDocument, cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV document with ID {cv_id} not found",
        )
    db.delete(cv)
    db.commit()
    return None


@router.patch(
    "/{cv_id}/toggle",
    response_model=CVDocumentResponse,
    summary="Admin: Toggle CV Document Active Status",
)
def admin_toggle_cv_active(
    cv_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Toggle the public visibility of a CV document."""
    cv = db.get(CVDocument, cv_id)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CV document with ID {cv_id} not found",
        )
    cv.is_active = not cv.is_active
    cv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cv)
    return cv


@router.post(
    "/upload",
    summary="Admin: Upload CV PDF File",
)
async def admin_upload_cv_file(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """Upload a PDF CV document to frontend/uploads/documents/."""
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".docx", ".doc"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed extensions: {', '.join(allowed_exts)}",
        )

    clean_basename = "".join(c for c in Path(file.filename).stem if c.isalnum() or c in ("-", "_")).lower()
    if not clean_basename:
        clean_basename = "cv"
    unique_filename = f"{clean_basename}_{uuid.uuid4().hex[:6]}{ext}"
    filepath = DOCS_UPLOAD_DIR / unique_filename

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_url = f"/uploads/documents/{unique_filename}"
    return {
        "status": "success",
        "url": relative_url,
        "filename": unique_filename,
        "original_name": file.filename,
    }
