from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from backend.app.database import Base


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), unique=True, index=True, nullable=False)
    original_name = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_data = Column(Text, nullable=False)  # Base64 encoded data
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
