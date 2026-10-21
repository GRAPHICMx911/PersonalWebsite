import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, or_, distinct
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.blog import BlogPost
from backend.app.models.user import User
from backend.app.core.dependencies import get_current_admin
from backend.app.schemas.blog import (
    BlogPostCreate,
    BlogPostUpdate,
    BlogPostResponse,
)
from backend.app.core.storage import save_uploaded_file

router = APIRouter(
    prefix="/api/blog",
    tags=["Technical Blog"],
)

# Upload directory for blog assets
BLOG_UPLOAD_DIR = Path("frontend/uploads/blog")
try:
    BLOG_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass


def slugify(text: str) -> str:
    """Generate a clean URL-friendly slug from title."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = text.strip("-")
    return text or f"article-{uuid.uuid4().hex[:6]}"


def ensure_unique_slug(db: Session, base_slug: str, current_id: Optional[int] = None) -> str:
    """Ensure slug is unique in blog_posts, appending a suffix if needed."""
    slug = base_slug
    counter = 1
    while True:
        stmt = select(BlogPost).where(BlogPost.slug == slug)
        if current_id:
            stmt = stmt.where(BlogPost.id != current_id)
        existing = db.scalars(stmt).first()
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================

@router.get(
    "/public",
    response_model=List[BlogPostResponse],
    summary="List Published Blog Posts",
)
def get_public_blog_posts(
    category: Optional[str] = Query(None, description="Filter by category"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, description="Search by title, excerpt, or content"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve published technical blog posts for public showcase."""
    statement = select(BlogPost).where(BlogPost.is_published == True)

    if category and category.lower() != "all":
        statement = statement.where(BlogPost.category.ilike(category.strip()))

    if tag:
        statement = statement.where(BlogPost.tags.ilike(f"%{tag.strip()}%"))

    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                BlogPost.title.ilike(pattern),
                BlogPost.subtitle.ilike(pattern),
                BlogPost.excerpt.ilike(pattern),
                BlogPost.tags.ilike(pattern),
            )
        )

    statement = statement.order_by(
        BlogPost.is_featured.desc(),
        BlogPost.published_at.desc(),
        BlogPost.id.desc(),
    ).offset(offset).limit(limit)

    return db.scalars(statement).all()


@router.get(
    "/categories",
    response_model=List[str],
    summary="List All Distinct Blog Categories",
)
def get_blog_categories(db: Session = Depends(get_db)):
    """Retrieve distinct categories of published articles."""
    statement = (
        select(distinct(BlogPost.category))
        .where(BlogPost.is_published == True)
        .order_by(BlogPost.category.asc())
    )
    categories = db.scalars(statement).all()
    return [c for c in categories if c]


@router.get(
    "/public/{slug}",
    response_model=BlogPostResponse,
    summary="Get Single Public Blog Post by Slug",
)
def get_public_blog_post(slug: str, db: Session = Depends(get_db)):
    """Retrieve a single published blog post by slug and increment view count."""
    statement = select(BlogPost).where(BlogPost.slug == slug, BlogPost.is_published == True)
    post = db.scalars(statement).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article '{slug}' was not found or is currently unpublished.",
        )

    # Increment view counter
    post.views_count += 1
    db.commit()
    db.refresh(post)
    return post


# =========================================================
# ADMIN CRUD ENDPOINTS
# =========================================================

@router.get(
    "",
    response_model=List[BlogPostResponse],
    summary="Admin List All Blog Posts",
)
def admin_list_blog_posts(
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by title, tag, or author"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all blog articles including drafts for admin management."""
    statement = select(BlogPost)

    if is_published is not None:
        statement = statement.where(BlogPost.is_published == is_published)

    if category and category.lower() != "all":
        statement = statement.where(BlogPost.category.ilike(category.strip()))

    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                BlogPost.title.ilike(pattern),
                BlogPost.subtitle.ilike(pattern),
                BlogPost.tags.ilike(pattern),
                BlogPost.author.ilike(pattern),
            )
        )

    statement = statement.order_by(
        BlogPost.created_at.desc(),
        BlogPost.id.desc(),
    )

    return db.scalars(statement).all()


@router.post(
    "",
    response_model=BlogPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin Create Blog Post",
)
def admin_create_blog_post(
    payload: BlogPostCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create a new technical blog post."""
    raw_slug = payload.slug.strip() if payload.slug else slugify(payload.title)
    final_slug = ensure_unique_slug(db, raw_slug)

    now = datetime.now(timezone.utc)
    published_date = now if payload.is_published else None

    # Estimate reading time if needed
    reading_time = payload.reading_time_minutes
    if not reading_time or reading_time < 1:
        words = len(payload.content.split())
        reading_time = max(1, words // 180)

    new_post = BlogPost(
        title=payload.title.strip(),
        slug=final_slug,
        subtitle=payload.subtitle.strip() if payload.subtitle else None,
        category=payload.category.strip() if payload.category else "Software Engineering",
        excerpt=payload.excerpt.strip() if payload.excerpt else None,
        content=payload.content.strip(),
        cover_image_url=payload.cover_image_url.strip() if payload.cover_image_url else None,
        author=payload.author.strip() if payload.author else "Design Lyricist",
        reading_time_minutes=reading_time,
        tags=payload.tags.strip() if payload.tags else None,
        views_count=0,
        is_published=payload.is_published,
        is_featured=payload.is_featured,
        published_at=published_date,
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get(
    "/{post_id}",
    response_model=BlogPostResponse,
    summary="Admin Get Blog Post by ID",
)
def admin_get_blog_post(
    post_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Retrieve details for a single blog post by numeric ID."""
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog post with ID {post_id} not found.",
        )
    return post


@router.put(
    "/{post_id}",
    response_model=BlogPostResponse,
    summary="Admin Update Blog Post",
)
def admin_update_blog_post(
    post_id: int,
    payload: BlogPostUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update fields of an existing blog post."""
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog post with ID {post_id} not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    # Handle slug updates
    if "slug" in update_data and update_data["slug"]:
        raw_slug = slugify(update_data["slug"])
        update_data["slug"] = ensure_unique_slug(db, raw_slug, current_id=post.id)

    # Handle publication timestamp
    if "is_published" in update_data:
        if update_data["is_published"] and not post.is_published and not post.published_at:
            post.published_at = datetime.now(timezone.utc)
        elif not update_data["is_published"]:
            pass  # keep published_at or optionally clear

    for field, val in update_data.items():
        if val is not None and isinstance(val, str):
            val = val.strip()
        setattr(post, field, val)

    post.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    return post


@router.delete(
    "/{post_id}",
    status_code=status.HTTP_200_OK,
    summary="Admin Delete Blog Post",
)
def admin_delete_blog_post(
    post_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a blog post from the database."""
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog post with ID {post_id} not found.",
        )

    db.delete(post)
    db.commit()
    return {"message": f"Blog post '{post.title}' successfully deleted."}


@router.post(
    "/upload-image",
    summary="Admin Upload Blog Cover or Diagram",
)
async def upload_blog_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Upload cover images, architectural diagrams, or screenshots for blog posts."""
    result = await save_uploaded_file(
        file=file,
        subfolder="blog",
        allowed_exts=[".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"],
        db=db,
    )
    return {"image_url": result["url"], "filename": result["filename"]}
