# 42Nexus - Vote Option Model
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Options for subject clarification votes

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class VoteOption(Base):
    __tablename__ = "vote_options"

    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_vote_id = Column(Integer, ForeignKey("subject_votes.id"), nullable=False)
    option_text = Column(String(300), nullable=False)

    # Relationships
    subject_vote = relationship("SubjectVote", back_populates="options")
    user_votes = relationship("UserVote", back_populates="option", cascade="all, delete-orphan")
