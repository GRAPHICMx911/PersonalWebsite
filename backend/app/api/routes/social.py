from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.social import SocialLink
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.social import (
    SocialLinkCreate,
    SocialLinkUpdate,
    SocialLinkResponse,
    SocialLinkReorderRequest,
)

router = APIRouter(
    prefix="/api/social",
    tags=["Social Links & Profiles"],
)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[SocialLinkResponse],
    summary="List Active Social Links for Public Showcase",
)
def get_public_social_links(
    db: Session = Depends(get_db),
):
    """Retrieve all active social media and developer profile links."""
    statement = (
        select(SocialLink)
        .where(SocialLink.is_active == True)
        .order_by(SocialLink.display_order.asc(), SocialLink.id.asc())
    )
    return db.scalars(statement).all()


# =========================================================
# ADMIN ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[SocialLinkResponse],
    summary="Admin List All Social Links",
)
def admin_get_all_social_links(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all social links for CMS administration."""
    statement = select(SocialLink).order_by(SocialLink.display_order.asc(), SocialLink.id.asc())
    return db.scalars(statement).all()


@router.post(
    "",
    response_model=SocialLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Social Link",
)
def admin_create_social_link(
    payload: SocialLinkCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new social link or profile."""
    new_link = SocialLink(
        platform_name=payload.platform_name.strip(),
        url=payload.url.strip(),
        icon_svg=payload.icon_svg.strip() if payload.icon_svg else None,
        icon_class=payload.icon_class.strip() if payload.icon_class else None,
        display_order=payload.display_order,
        is_active=payload.is_active,
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    return new_link


@router.get(
    "/{social_id}",
    response_model=SocialLinkResponse,
    summary="Admin Get Single Social Link",
)
def admin_get_social_link(
    social_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve single social link by ID."""
    link = db.get(SocialLink, social_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Social link with ID {social_id} not found.",
        )
    return link


@router.put(
    "/{social_id}",
    response_model=SocialLinkResponse,
    summary="Admin Update Social Link",
)
def admin_update_social_link(
    social_id: int,
    payload: SocialLinkUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update details of an existing social link."""
    link = db.get(SocialLink, social_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Social link with ID {social_id} not found.",
        )

    if payload.platform_name is not None:
        link.platform_name = payload.platform_name.strip()
    if payload.url is not None:
        link.url = payload.url.strip()
    if payload.icon_svg is not None:
        link.icon_svg = payload.icon_svg.strip() if payload.icon_svg else None
    if payload.icon_class is not None:
        link.icon_class = payload.icon_class.strip() if payload.icon_class else None
    if payload.display_order is not None:
        link.display_order = payload.display_order
    if payload.is_active is not None:
        link.is_active = payload.is_active

    link.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(link)
    return link


@router.patch(
    "/{social_id}/toggle",
    response_model=SocialLinkResponse,
    summary="Admin Toggle Active Status",
)
def admin_toggle_social_active(
    social_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Toggle is_active on or off."""
    link = db.get(SocialLink, social_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Social link with ID {social_id} not found.",
        )

    link.is_active = not link.is_active
    link.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(link)
    return link


@router.post(
    "/reorder",
    summary="Admin Reorder Social Links",
)
def admin_reorder_social_links(
    payload: SocialLinkReorderRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Bulk update display orders."""
    now = datetime.now(timezone.utc)
    for item in payload.items:
        link = db.get(SocialLink, item.id)
        if link:
            link.display_order = item.display_order
            link.updated_at = now
    db.commit()
    return {"message": "Social link orders successfully updated."}


@router.delete(
    "/{social_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Social Link",
)
def admin_delete_social_link(
    social_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete a social link."""
    link = db.get(SocialLink, social_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Social link with ID {social_id} not found.",
        )

    db.delete(link)
    db.commit()
    return {"message": f"Social link '{link.platform_name}' was permanently deleted."}
