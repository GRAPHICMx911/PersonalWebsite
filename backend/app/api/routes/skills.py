from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload

from backend.app.database import get_db
from backend.app.models.skill import Skill, SkillCategory
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.skill import (
    SkillCategoryCreate,
    SkillCategoryUpdate,
    SkillCategoryResponse,
    SkillCreate,
    SkillUpdate,
    SkillResponse,
)

router = APIRouter(
    prefix="/api/skills",
    tags=["Skills"],
)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/categories",
    response_model=List[SkillCategoryResponse],
    summary="List Active Skill Categories",
)
def get_public_skill_categories(db: Session = Depends(get_db)):
    """Retrieve all active skill categories sorted by display order."""
    statement = (
        select(SkillCategory)
        .where(SkillCategory.is_active == True)
        .order_by(SkillCategory.display_order.asc(), SkillCategory.name.asc())
    )
    categories = db.scalars(statement).all()
    return categories


@router.get(
    "/public",
    response_model=List[SkillResponse],
    summary="List Visible Skills for Public Portfolio",
)
def get_public_skills(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search skill name or description"),
    db: Session = Depends(get_db),
):
    """Retrieve all visible skills for public portfolio presentation."""
    statement = (
        select(Skill)
        .options(joinedload(Skill.category))
        .where(Skill.is_visible == True)
    )

    if category_id is not None:
        statement = statement.where(Skill.category_id == category_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Skill.name.ilike(search_pattern),
                Skill.description.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Skill.display_order.asc(),
        Skill.proficiency.desc(),
        Skill.name.asc(),
    )

    skills = db.scalars(statement).unique().all()
    return skills


@router.get(
    "/featured",
    response_model=List[SkillResponse],
    summary="List Featured Core Competencies",
)
def get_featured_skills(db: Session = Depends(get_db)):
    """Retrieve top featured skills for homepage highlighting."""
    statement = (
        select(Skill)
        .options(joinedload(Skill.category))
        .where(Skill.is_featured == True, Skill.is_visible == True)
        .order_by(Skill.display_order.asc(), Skill.proficiency.desc())
    )
    skills = db.scalars(statement).unique().all()
    return skills


# =========================================================
# ADMIN CRUD ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[SkillResponse],
    summary="Admin List All Skills",
)
def admin_list_skills(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    is_visible: Optional[bool] = Query(None, description="Filter by visibility"),
    search: Optional[str] = Query(None, description="Search by name"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all skills (including hidden) with administrative metadata."""
    statement = select(Skill).options(joinedload(Skill.category))

    if category_id is not None:
        statement = statement.where(Skill.category_id == category_id)

    if is_visible is not None:
        statement = statement.where(Skill.is_visible == is_visible)

    if search:
        search_pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Skill.name.ilike(search_pattern),
                Skill.description.ilike(search_pattern),
            )
        )

    statement = statement.order_by(
        Skill.display_order.asc(),
        Skill.name.asc(),
    )

    skills = db.scalars(statement).unique().all()
    return skills


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Skill",
)
def admin_create_skill(
    payload: SkillCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a new professional skill."""
    # Verify category if provided
    if payload.category_id:
        category = db.get(SkillCategory, payload.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill category with ID {payload.category_id} not found",
            )

    new_skill = Skill(
        category_id=payload.category_id,
        name=payload.name.strip(),
        proficiency=payload.proficiency,
        proficiency_level=payload.proficiency_level.strip(),
        icon=payload.icon.strip() if payload.icon else None,
        description=payload.description.strip() if payload.description else None,
        display_order=payload.display_order,
        is_featured=payload.is_featured,
        is_visible=payload.is_visible,
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
    summary="Admin Get Skill Details",
)
def admin_get_skill(
    skill_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve full details of a specific skill."""
    statement = (
        select(Skill)
        .options(joinedload(Skill.category))
        .where(Skill.id == skill_id)
    )
    skill = db.scalar(statement)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill with ID {skill_id} not found",
        )
    return skill


@router.put(
    "/{skill_id}",
    response_model=SkillResponse,
    summary="Admin Update Skill",
)
def admin_update_skill(
    skill_id: int,
    payload: SkillUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update an existing skill."""
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill with ID {skill_id} not found",
        )

    if payload.category_id is not None:
        if payload.category_id > 0:
            category = db.get(SkillCategory, payload.category_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Skill category with ID {payload.category_id} not found",
                )
            skill.category_id = payload.category_id
        else:
            skill.category_id = None

    if payload.name is not None:
        skill.name = payload.name.strip()
    if payload.proficiency is not None:
        skill.proficiency = payload.proficiency
    if payload.proficiency_level is not None:
        skill.proficiency_level = payload.proficiency_level.strip()
    if payload.icon is not None:
        skill.icon = payload.icon.strip() if payload.icon else None
    if payload.description is not None:
        skill.description = payload.description.strip() if payload.description else None
    if payload.display_order is not None:
        skill.display_order = payload.display_order
    if payload.is_featured is not None:
        skill.is_featured = payload.is_featured
    if payload.is_visible is not None:
        skill.is_visible = payload.is_visible

    skill.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Skill",
)
def admin_delete_skill(
    skill_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Permanently delete a skill."""
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill with ID {skill_id} not found",
        )

    db.delete(skill)
    db.commit()
    return {
        "success": True,
        "message": f"Skill '{skill.name}' (ID: {skill_id}) successfully deleted.",
    }


# =========================================================
# ADMIN CATEGORY CRUD
# =========================================================

@router.post(
    "/categories",
    response_model=SkillCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Skill Category",
)
def admin_create_skill_category(
    payload: SkillCategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Add a new skill category."""
    existing = db.scalar(
        select(SkillCategory).where(
            or_(
                SkillCategory.name == payload.name.strip(),
                SkillCategory.slug == payload.slug.strip(),
            )
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A skill category with this name or slug already exists",
        )

    new_cat = SkillCategory(
        name=payload.name.strip(),
        slug=payload.slug.strip(),
        description=payload.description.strip() if payload.description else None,
        display_order=payload.display_order,
        is_active=payload.is_active,
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


@router.put(
    "/categories/{category_id}",
    response_model=SkillCategoryResponse,
    summary="Admin Update Skill Category",
)
def admin_update_skill_category(
    category_id: int,
    payload: SkillCategoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update a skill category."""
    category = db.get(SkillCategory, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill category with ID {category_id} not found",
        )

    if payload.name is not None:
        category.name = payload.name.strip()
    if payload.slug is not None:
        category.slug = payload.slug.strip()
    if payload.description is not None:
        category.description = payload.description.strip() if payload.description else None
    if payload.display_order is not None:
        category.display_order = payload.display_order
    if payload.is_active is not None:
        category.is_active = payload.is_active

    category.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(category)
    return category


@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Skill Category",
)
def admin_delete_skill_category(
    category_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a skill category."""
    category = db.get(SkillCategory, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill category with ID {category_id} not found",
        )

    db.delete(category)
    db.commit()
    return {
        "success": True,
        "message": f"Category '{category.name}' (ID: {category_id}) successfully deleted.",
    }
