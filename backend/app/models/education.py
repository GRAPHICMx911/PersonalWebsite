from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime, timezone
from backend.app.database import Base


class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)
    institution = Column(String(200), nullable=False, index=True)
    degree = Column(String(200), nullable=False, index=True)
    field_of_study = Column(String(200), nullable=False, index=True)
    start_year = Column(String(50), nullable=True)
    end_year = Column(String(50), nullable=True)
    grade = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    activities = Column(String(500), nullable=True)
    institution_url = Column(String(500), nullable=True)
    institution_logo_url = Column(String(500), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
