import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, or_, distinct
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.design import DesignItem
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.design import (
    DesignItemCreate,
    DesignItemUpdate,
    DesignItemResponse,
)

router = APIRouter(
    prefix="/api/design",
    tags=["Design Portfolio"],
)

# Upload directory
DESIGN_UPLOAD_DIR = Path("frontend/uploads/design")
try:
    DESIGN_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[DesignItemResponse],
    summary="List Active Design Items for Public Showcase",
)
def get_public_design_items(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title, tags, or client"),
    db: Session = Depends(get_db),
):
    """Retrieve all active design items for public portfolio display."""
    statement = select(DesignItem).where(DesignItem.is_active == True)

    if category and category.lower() != "all":
        statement = statement.where(DesignItem.category.ilike(category.strip()))

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                DesignItem.title.ilike(search_pattern),
                DesignItem.tags.ilike(search_pattern),
                DesignItem.client.ilike(search_pattern),
                DesignItem.tools_used.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        DesignItem.display_order.asc(),
        DesignItem.created_at.desc(),
    )

    items = db.scalars(statement).all()
    return items


@router.get(
    "/categories",
    response_model=List[str],
    summary="List All Distinct Design Categories",
)
def get_design_categories(db: Session = Depends(get_db)):
    """Retrieve a list of unique categories among active design items."""
    statement = (
        select(distinct(DesignItem.category))
        .where(DesignItem.is_active == True)
        .order_by(DesignItem.category.asc())
    )
    categories = db.scalars(statement).all()
    return [c for c in categories if c]


@router.get(
    "/public/{item_id}",
    response_model=DesignItemResponse,
    summary="Get Single Public Design Item",
)
def get_public_design_item(item_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a single active design portfolio item."""
    item = db.get(DesignItem, item_id)
    if not item or not item.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Design item with ID {item_id} not found or inactive",
        )
    return item


# =========================================================
# ADMIN CRUD ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[DesignItemResponse],
    summary="Admin List All Design Items",
)
def admin_list_design_items(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by keyword"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all design items (including drafts and inactive)."""
    statement = select(DesignItem)

    if is_active is not None:
        statement = statement.where(DesignItem.is_active == is_active)

    if category and category.lower() != "all":
        statement = statement.where(DesignItem.category.ilike(category.strip()))

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                DesignItem.title.ilike(search_pattern),
                DesignItem.tags.ilike(search_pattern),
                DesignItem.client.ilike(search_pattern),
                DesignItem.tools_used.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        DesignItem.display_order.asc(),
        DesignItem.created_at.desc(),
    )

    items = db.scalars(statement).all()
    return items


@router.post(
    "",
    response_model=DesignItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Design Item",
)
def admin_create_design_item(
    payload: DesignItemCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new graphic design portfolio entry."""
    new_item = DesignItem(
        title=payload.title.strip(),
        category=payload.category.strip() if payload.category else "Graphic Design",
        client=payload.client.strip() if payload.client else None,
        year=payload.year.strip() if payload.year else None,
        image_url=payload.image_url.strip(),
        thumbnail_url=payload.thumbnail_url.strip() if payload.thumbnail_url else None,
        tools_used=payload.tools_used.strip() if payload.tools_used else None,
        description=payload.description.strip() if payload.description else None,
        aspect_ratio=payload.aspect_ratio.strip() if payload.aspect_ratio else "16:9",
        tags=payload.tags.strip() if payload.tags else None,
        display_order=payload.display_order,
        is_featured=payload.is_featured,
        is_active=payload.is_active,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.get(
    "/{item_id}",
    response_model=DesignItemResponse,
    summary="Admin Get Design Item by ID",
)
def admin_get_design_item(
    item_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve details for a specific design item by ID."""
    item = db.get(DesignItem, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Design item with ID {item_id} not found",
        )
    return item


@router.put(
    "/{item_id}",
    response_model=DesignItemResponse,
    summary="Admin Update Design Item",
)
def admin_update_design_item(
    item_id: int,
    payload: DesignItemUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update fields on an existing design item."""
    item = db.get(DesignItem, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Design item with ID {item_id} not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None and isinstance(val, str):
            val = val.strip()
        setattr(item, field, val)

    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Design Item",
)
def admin_delete_design_item(
    item_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a design portfolio item."""
    item = db.get(DesignItem, item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Design item with ID {item_id} not found",
        )

    db.delete(item)
    db.commit()
    return {"message": f"Design item '{item.title}' successfully deleted."}


@router.post(
    "/upload-image",
    summary="Admin Upload Design Mockup / Artwork",
)
async def upload_design_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    """Upload visual design mockups, illustrations, or graphics."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image format (PNG, JPEG, WebP, SVG, GIF)",
        )

    extension = Path(file.filename).suffix.lower()
    if extension not in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]:
        extension = ".png"

    filename = f"design_{uuid.uuid4().hex[:12]}{extension}"
    target_path = DESIGN_UPLOAD_DIR / filename

    content = await file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    return {"image_url": f"/uploads/design/{filename}"}
