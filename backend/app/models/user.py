# 42Nexus - User Model
# This file is for: ADMIRAL (Backend Dev 1)
# Description: User model for 42 OAuth authenticated users

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(enum.Enum):
    STUDENT = "student"
    STAFF = "staff"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)  # 42 intra ID (not auto-increment!)
    login = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    display_name = Column(String(100))
    avatar_url = Column(String(500))
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    campus_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
