from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database import Base


class UXUICaseStudy(Base):
    """
    UX/UI Case Study model representing deep-dive product design,
    wireframes, design systems, and prototype case studies.
    """
    __tablename__ = "ux_ui_case_studies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(300), nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="Web Application")
    client: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tools_used: Mapped[str | None] = mapped_column(String(300), nullable=True)
    cover_image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    preview_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    problem_statement: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution_overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    design_process: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_results: Mapped[str | None] = mapped_column(Text, nullable=True)
    figma_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    live_prototype_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<UXUICaseStudy(id={self.id}, title='{self.title}', category='{self.category}')>"
