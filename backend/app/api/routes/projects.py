import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from backend.app.database import get_db
from backend.app.models.project import Project, ProjectCategory
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin


router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"],
)


# =========================================================
# CATEGORY SCHEMAS
# =========================================================

class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    is_active: bool = True


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# =========================================================
# PROJECT SCHEMAS
# =========================================================

class ProjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    slug: str = Field(min_length=2, max_length=220)
    short_description: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None
    category_id: int
    technologies: Optional[str] = None
    project_url: Optional[str] = Field(default=None, max_length=500)
    github_url: Optional[str] = Field(default=None, max_length=500)
    image_url: Optional[str] = Field(default=None, max_length=500)
    is_featured: bool = False
    is_published: bool = False
    display_order: int = 0


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=220)
    short_description: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None
    category_id: Optional[int] = None
    technologies: Optional[str] = None
    project_url: Optional[str] = Field(default=None, max_length=500)
    github_url: Optional[str] = Field(default=None, max_length=500)
    image_url: Optional[str] = Field(default=None, max_length=500)
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    display_order: Optional[int] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    category_id: int
    technologies: Optional[str] = None
    project_url: Optional[str] = None
    github_url: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: bool
    is_published: bool
    display_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None


# =========================================================
# CATEGORY ROUTES
# =========================================================

@router.get(
    "/categories",
    response_model=list[CategoryResponse],
    summary="List all project categories",
)
def get_categories(db: Session = Depends(get_db)):
    statement = select(ProjectCategory).order_by(ProjectCategory.name)
    return db.scalars(statement).all()


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project category (Admin only)",
)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    existing_name = db.scalar(
        select(ProjectCategory).where(ProjectCategory.name == category_data.name)
    )
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name already exists.",
        )

    existing_slug = db.scalar(
        select(ProjectCategory).where(ProjectCategory.slug == category_data.slug)
    )
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this slug already exists.",
        )

    category = ProjectCategory(
        name=category_data.name,
        slug=category_data.slug,
        description=category_data.description,
        is_active=category_data.is_active,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete(
    "/categories/{category_id}",
    summary="Delete a project category (Admin only)",
)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    category = db.get(ProjectCategory, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )

    project_exists = db.scalar(
        select(Project.id).where(Project.category_id == category_id).limit(1)
    )
    if project_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This category cannot be deleted because projects are using it.",
        )

    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully."}


# =========================================================
# PROJECT ROUTES
# =========================================================

@router.get(
    "",
    response_model=list[ProjectResponse],
    summary="List all projects",
)
def get_projects(db: Session = Depends(get_db)):
    statement = (
        select(Project)
        .options(joinedload(Project.category))
        .order_by(
            Project.display_order,
            Project.created_at.desc(),
        )
    )
    return db.scalars(statement).unique().all()


@router.get(
    "/published",
    response_model=list[ProjectResponse],
    summary="List published projects only",
)
def get_published_projects(db: Session = Depends(get_db)):
    statement = (
        select(Project)
        .options(joinedload(Project.category))
        .where(Project.is_published.is_(True))
        .order_by(
            Project.display_order,
            Project.created_at.desc(),
        )
    )
    return db.scalars(statement).unique().all()


@router.get(
    "/slug/{slug}",
    response_model=ProjectResponse,
    summary="Get single project by slug",
)
def get_project_by_slug(slug: str, db: Session = Depends(get_db)):
    statement = (
        select(Project)
        .options(joinedload(Project.category))
        .where(Project.slug == slug)
    )
    project = db.scalar(statement)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    return project


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get single project by ID",
)
def get_project(project_id: int, db: Session = Depends(get_db)):
    statement = (
        select(Project)
        .options(joinedload(Project.category))
        .where(Project.id == project_id)
    )
    project = db.scalar(statement)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    return project


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project (Admin only)",
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    category = db.get(ProjectCategory, project_data.category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected project category does not exist.",
        )

    existing_slug = db.scalar(
        select(Project).where(Project.slug == project_data.slug)
    )
    if existing_slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A project with this slug already exists.",
        )

    project = Project(
        title=project_data.title,
        slug=project_data.slug,
        short_description=project_data.short_description,
        description=project_data.description,
        category_id=project_data.category_id,
        technologies=project_data.technologies,
        project_url=project_data.project_url,
        github_url=project_data.github_url,
        image_url=project_data.image_url,
        is_featured=project_data.is_featured,
        is_published=project_data.is_published,
        display_order=project_data.display_order,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    statement = (
        select(Project)
        .options(joinedload(Project.category))
        .where(Project.id == project.id)
    )
    return db.scalar(statement)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update an existing project (Admin only)",
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    update_data = project_data.model_dump(exclude_unset=True)

    if "category_id" in update_data and update_data["category_id"] is not None:
        category = db.get(ProjectCategory, update_data["category_id"])
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected category does not exist.",
            )

    if "slug" in update_data and update_data["slug"]:
        existing_slug = db.scalar(
            select(Project).where(
                Project.slug == update_data["slug"],
                Project.id != project_id,
            )
        )
        if existing_slug:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A project with this slug already exists.",
            )

    for field, value in update_data.items():
        setattr(project, field, value)

    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)

    statement = (
        select(Project)
        .options(joinedload(Project.category))
        .where(Project.id == project.id)
    )
    return db.scalar(statement)


@router.delete(
    "/{project_id}",
    summary="Delete a project (Admin only)",
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully."}


@router.post(
    "/upload-image",
    summary="Upload a project image (Admin only)",
)
async def upload_project_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed: JPG, PNG, WEBP, GIF, SVG.",
        )

    upload_dir = Path("frontend/uploads/projects")
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix.lower() or ".png"
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = upload_dir / unique_filename

    contents = await file.read()
    with open(destination_path, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/projects/{unique_filename}"
    return {"image_url": image_url, "filename": unique_filename}