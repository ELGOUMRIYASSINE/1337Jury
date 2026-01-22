# 1337Jury - Vote Option Model
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Options for subject clarification votes

from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class VoteOption(Base):
    __tablename__ = "vote_options"

    id = Column(Integer, primary_key=True, index=True)
    subject_vote_id = Column(Integer, ForeignKey("subject_votes.id"), nullable=False)
    text = Column(String(500), nullable=False)
    vote_count = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "subject_vote_id": self.subject_vote_id,
            "text": self.text,
            "vote_count": self.vote_count,
        }