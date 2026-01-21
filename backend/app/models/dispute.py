# 42Nexus - Dispute Model
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Correction disputes with staff override

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class DisputeStatus(enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    STAFF_DECIDED = "staff_decided"


class DisputeUrgency(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class DisputeWinner(enum.Enum):
    CORRECTOR = "corrector"
    CORRECTED = "corrected"


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=False)
    corrector_opinion = Column(Text, nullable=False)
    corrected_opinion = Column(Text, nullable=False)
    urgency = Column(Enum(DisputeUrgency), default=DisputeUrgency.MEDIUM)
    status = Column(Enum(DisputeStatus), default=DisputeStatus.ACTIVE)
    winner = Column(Enum(DisputeWinner))
    staff_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))

    # Relationships
    project = relationship("Project")
    creator = relationship("User", foreign_keys=[creator_id])
    staff_user = relationship("User", foreign_keys=[staff_user_id])
    votes = relationship("DisputeVote", back_populates="dispute", cascade="all, delete-orphan")
