# 1337Jury - Resource Model
# This file is for: ZERO (Backend Dev 2)
# Description: Learning resources model with type classification

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class ResourceType(str, enum.Enum):
    VIDEO = "video"
    ARTICLE = "article"
    DOCUMENTATION = "documentation"
    TUTORIAL = "tutorial"
    OTHER = "other"


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    resource_type = Column(Enum(ResourceType), default=ResourceType.OTHER)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())