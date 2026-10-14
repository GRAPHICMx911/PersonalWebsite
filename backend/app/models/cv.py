from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime, timezone
from backend.app.database import Base


class CVDocument(Base):
    __tablename__ = "cv_documents"

    id = Column(Integer, primary_key=True, index=True)
    role_key = Column(String(50), unique=True, index=True, nullable=True)
    title = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    target_role = Column(String(150), nullable=True)
    description = Column(Text, nullable=False)
    bullets = Column(Text, nullable=True)
    tags = Column(String(300), nullable=True)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(200), nullable=False)
    icon = Column(String(50), default="💻", nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
