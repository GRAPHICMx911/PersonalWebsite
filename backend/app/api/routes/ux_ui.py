import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, or_, distinct
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.ux_ui import UXUICaseStudy
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.ux_ui import (
    UXUICaseStudyCreate,
    UXUICaseStudyUpdate,
    UXUICaseStudyResponse,
)

router = APIRouter(
    prefix="/api/ux-ui",
    tags=["UX/UI Portfolio"],
)

# Upload directory
UXUI_UPLOAD_DIR = Path("frontend/uploads/ux-ui")
UXUI_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[UXUICaseStudyResponse],
    summary="List Active UX/UI Case Studies for Public Showcase",
)
def get_public_case_studies(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title, client, or role"),
    db: Session = Depends(get_db),
):
    """Retrieve all active UX/UI case studies for public viewing."""
    statement = select(UXUICaseStudy).where(UXUICaseStudy.is_active == True)

    if category and category.lower() != "all":
        statement = statement.where(UXUICaseStudy.category.ilike(category.strip()))

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                UXUICaseStudy.title.ilike(search_pattern),
                UXUICaseStudy.subtitle.ilike(search_pattern),
                UXUICaseStudy.client.ilike(search_pattern),
                UXUICaseStudy.tools_used.ilike(search_pattern),
                UXUICaseStudy.problem_statement.ilike(search_pattern),
                UXUICaseStudy.solution_overview.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        UXUICaseStudy.display_order.asc(),
        UXUICaseStudy.created_at.desc(),
    )

    case_studies = db.scalars(statement).all()
    return case_studies


@router.get(
    "/categories",
    response_model=List[str],
    summary="List All Distinct UX/UI Categories",
)
def get_ux_ui_categories(db: Session = Depends(get_db)):
    """Retrieve unique categories among active UX/UI case studies."""
    statement = (
        select(distinct(UXUICaseStudy.category))
        .where(UXUICaseStudy.is_active == True)
        .order_by(UXUICaseStudy.category.asc())
    )
    categories = db.scalars(statement).all()
    return [c for c in categories if c]


@router.get(
    "/public/{case_study_id}",
    response_model=UXUICaseStudyResponse,
    summary="Get Single Public UX/UI Case Study",
)
def get_public_case_study(case_study_id: int, db: Session = Depends(get_db)):
    """Retrieve full details for a single active UX/UI case study."""
    cs = db.get(UXUICaseStudy, case_study_id)
    if not cs or not cs.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"UX/UI Case Study with ID {case_study_id} not found or inactive",
        )
    return cs


# =========================================================
# ADMIN CRUD ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[UXUICaseStudyResponse],
    summary="Admin List All UX/UI Case Studies",
)
def admin_list_case_studies(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by keyword"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all UX/UI case studies (including drafts and inactive)."""
    statement = select(UXUICaseStudy)

    if is_active is not None:
        statement = statement.where(UXUICaseStudy.is_active == is_active)

    if category and category.lower() != "all":
        statement = statement.where(UXUICaseStudy.category.ilike(category.strip()))

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                UXUICaseStudy.title.ilike(search_pattern),
                UXUICaseStudy.subtitle.ilike(search_pattern),
                UXUICaseStudy.client.ilike(search_pattern),
                UXUICaseStudy.tools_used.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        UXUICaseStudy.display_order.asc(),
        UXUICaseStudy.created_at.desc(),
    )

    items = db.scalars(statement).all()
    return items


@router.post(
    "",
    response_model=UXUICaseStudyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create UX/UI Case Study",
)
def admin_create_case_study(
    payload: UXUICaseStudyCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new UX/UI case study."""
    new_cs = UXUICaseStudy(
        title=payload.title.strip(),
        subtitle=payload.subtitle.strip() if payload.subtitle else None,
        category=payload.category.strip() if payload.category else "Web Application",
        client=payload.client.strip() if payload.client else None,
        role=payload.role.strip() if payload.role else None,
        duration=payload.duration.strip() if payload.duration else None,
        tools_used=payload.tools_used.strip() if payload.tools_used else None,
        cover_image_url=payload.cover_image_url.strip(),
        preview_image_url=payload.preview_image_url.strip() if payload.preview_image_url else None,
        problem_statement=payload.problem_statement.strip() if payload.problem_statement else None,
        solution_overview=payload.solution_overview.strip() if payload.solution_overview else None,
        design_process=payload.design_process.strip() if payload.design_process else None,
        key_results=payload.key_results.strip() if payload.key_results else None,
        figma_url=payload.figma_url.strip() if payload.figma_url else None,
        live_prototype_url=payload.live_prototype_url.strip() if payload.live_prototype_url else None,
        display_order=payload.display_order,
        is_featured=payload.is_featured,
        is_active=payload.is_active,
    )

    db.add(new_cs)
    db.commit()
    db.refresh(new_cs)
    return new_cs


@router.get(
    "/{case_study_id}",
    response_model=UXUICaseStudyResponse,
    summary="Admin Get UX/UI Case Study by ID",
)
def admin_get_case_study(
    case_study_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve details for a specific case study by ID."""
    cs = db.get(UXUICaseStudy, case_study_id)
    if not cs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"UX/UI Case Study with ID {case_study_id} not found",
        )
    return cs


@router.put(
    "/{case_study_id}",
    response_model=UXUICaseStudyResponse,
    summary="Admin Update UX/UI Case Study",
)
def admin_update_case_study(
    case_study_id: int,
    payload: UXUICaseStudyUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update fields on an existing UX/UI case study."""
    cs = db.get(UXUICaseStudy, case_study_id)
    if not cs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"UX/UI Case Study with ID {case_study_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None and isinstance(val, str):
            val = val.strip()
        setattr(cs, field, val)

    cs.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cs)
    return cs


@router.delete(
    "/{case_study_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete UX/UI Case Study",
)
def admin_delete_case_study(
    case_study_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a UX/UI case study."""
    cs = db.get(UXUICaseStudy, case_study_id)
    if not cs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"UX/UI Case Study with ID {case_study_id} not found",
        )

    db.delete(cs)
    db.commit()
    return {"message": f"UX/UI Case Study '{cs.title}' successfully deleted."}


@router.post(
    "/upload-image",
    summary="Admin Upload UX/UI Mockup / Screenshot",
)
async def upload_ux_ui_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """Upload product mockups, wireframes, and UI screenshots."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image format (PNG, JPEG, WebP, SVG, GIF)",
        )

    extension = Path(file.filename).suffix.lower()
    if extension not in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]:
        extension = ".png"

    filename = f"uxui_{uuid.uuid4().hex[:12]}{extension}"
    target_path = UXUI_UPLOAD_DIR / filename

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    return {"image_url": f"/uploads/ux-ui/{filename}"}
