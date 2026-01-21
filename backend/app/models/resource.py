# 42Nexus - Resource Model
# This file is for: ZERO (Backend Dev 2)
# Description: Learning resources model with type classification

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class ResourceType(enum.Enum):
    DOCUMENTATION = "documentation"
    TUTORIAL = "tutorial"
    VIDEO = "video"
    ARTICLE = "article"
    OTHER = "other"


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    url = Column(String(500), nullable=False)
    resource_type = Column(Enum(ResourceType), default=ResourceType.OTHER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project")
    user = relationship("User")
    votes = relationship("ResourceVote", back_populates="resource", cascade="all, delete-orphan")
