# 42Nexus - Subject Vote Model
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Subject clarification voting with staff override

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class VoteStatus(enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    STAFF_DECIDED = "staff_decided"


class SubjectVote(Base):
    __tablename__ = "subject_votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(String(500), nullable=False)
    context = Column(Text)
    status = Column(Enum(VoteStatus), default=VoteStatus.OPEN)
    staff_decision = Column(String(50))  # 'allowed' or 'not_allowed'
    staff_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))

    # Relationships
    project = relationship("Project")
    user = relationship("User", foreign_keys=[user_id])
    staff_user = relationship("User", foreign_keys=[staff_user_id])
    options = relationship("VoteOption", back_populates="subject_vote", cascade="all, delete-orphan")
