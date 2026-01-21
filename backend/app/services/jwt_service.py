# 42Nexus - JWT Service
# This file is for: ADMIRAL (Backend Dev 1)
# Description: JWT token creation and verification

from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.config import settings


def create_access_token(user_id: int) -> str:
    """Create a JWT access token for a user"""
    expire = datetime.utcnow() + timedelta(seconds=settings.JWT_EXPIRATION)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )


def verify_token(token: str) -> int | None:
    """Verify a JWT token and return the user ID"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return int(payload.get("sub"))
    except JWTError:
        return None
