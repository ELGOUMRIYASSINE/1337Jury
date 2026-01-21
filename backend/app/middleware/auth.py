# 42Nexus - Authentication Middleware
# This file is for: ADMIRAL (Backend Dev 1)
# Description: JWT authentication and authorization middleware

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.services.jwt_service import verify_token
from app.models.user import User, UserRole

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user (required)"""
    user_id = verify_token(credentials.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated (optional)"""
    if not credentials:
        return None
    
    user_id = verify_token(credentials.credentials)
    return await db.get(User, user_id) if user_id else None


async def get_current_staff(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require staff access - CRITICAL for staff override features"""
    if current_user.role != UserRole.STAFF:
        raise HTTPException(status_code=403, detail="Staff access required")
    
    return current_user
