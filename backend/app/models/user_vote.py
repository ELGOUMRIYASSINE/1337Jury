# 1337Jury - User Vote Model
# This file is for: ADMIRAL (Backend Dev 1)
# Description: User's vote on subject clarification questions

from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class UserVote(Base):
    __tablename__ = "user_votes"

    id = Column(Integer, primary_key=True, index=True)
    subject_vote_id = Column(Integer, ForeignKey("subject_votes.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("vote_options.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('subject_vote_id', 'user_id', name='unique_user_vote'),
    )
