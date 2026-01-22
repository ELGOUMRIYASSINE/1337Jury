# Recode Request Model - Mock Evaluation & Recoding
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class RequestStatus(str, enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RecodeRequest(Base):
    __tablename__ = "recode_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    campus = Column(String(100), nullable=False)  # Which campus they want recoder from
    meeting_platform = Column(String(100), nullable=False)  # Discord, Google Meet, etc.
    meeting_link = Column(String(500), nullable=True)  # Optional link to meeting
    description = Column(Text, nullable=True)  # Additional notes
    status = Column(String(20), default="open")
    matched_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who accepted
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "campus": self.campus,
            "meeting_platform": self.meeting_platform,
            "meeting_link": self.meeting_link,
            "description": self.description,
            "status": self.status,
            "matched_user_id": self.matched_user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }