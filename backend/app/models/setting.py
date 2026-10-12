from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime, timezone
from backend.app.database import Base


class SiteSetting(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)

    # General Profile
    full_name = Column(String(150), default="Design Lyricist", nullable=False)
    professional_title = Column(String(250), default="Senior Full-Stack Engineer & Cloud Architect", nullable=False)
    bio_summary = Column(Text, nullable=True)
    avatar_image_url = Column(String(500), nullable=True)
    contact_email = Column(String(200), default="admin@example.com", nullable=False)
    location = Column(String(150), default="San Francisco, CA / Remote", nullable=True)
    resume_download_url = Column(String(500), nullable=True)

    # Hero Section
    hero_pill_text = Column(String(200), default="🚀 Production Ready Solutions & Engineering", nullable=False)
    hero_title_prefix = Column(String(200), default="Building Scalable Systems, Robust Security &", nullable=False)
    hero_title_highlight = Column(String(200), default="Modern Digital Experiences", nullable=False)
    hero_description = Column(Text, default="Senior Full-Stack Engineer, Cybersecurity Specialist, Cloud Architect & Designer. Delivering end-to-end digital excellence across Software Engineering, AWS Cloud, Networks, and UX/UI Design.", nullable=False)
    hero_primary_btn_text = Column(String(100), default="Explore Featured Projects ↓", nullable=False)
    hero_primary_btn_url = Column(String(250), default="#projects", nullable=False)
    hero_secondary_btn_text = Column(String(100), default="Download Resume / CV 📄", nullable=False)
    hero_secondary_btn_url = Column(String(250), default="/uploads/documents/resume.pdf", nullable=True)

    # SEO & Meta
    meta_title = Column(String(250), default="Design Lyricist — Senior Full-Stack Engineer & Cloud Architect", nullable=False)
    meta_description = Column(Text, default="Portfolio and engineering showcase of Design Lyricist: Full-Stack Engineering, Cloud Architecture, Cybersecurity, and UX/UI Design.", nullable=False)
    meta_keywords = Column(String(500), default="Full-Stack Engineer, Cloud Architect, FastAPI, PostgreSQL, AWS, Cybersecurity, UX/UI", nullable=True)
    og_image_url = Column(String(500), nullable=True)

    # Availability & Career Status
    is_hiring_available = Column(Boolean, default=True, nullable=False)
    availability_badge_text = Column(String(150), default="Open for Senior / Staff / Lead Roles", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
