# 42Nexus - Dispute Vote Model
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Votes on correction disputes

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.dispute import DisputeWinner


class DisputeVote(Base):
    __tablename__ = "dispute_votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote_for = Column(Enum(DisputeWinner), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint('dispute_id', 'user_id'),)

    # Relationships
    dispute = relationship("Dispute", back_populates="votes")
    user = relationship("User")
