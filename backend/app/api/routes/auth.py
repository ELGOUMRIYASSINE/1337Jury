# 42Nexus - Authentication Routes
# This file is for: ADMIRAL (Backend Dev 1)
# Description: 42 OAuth authentication endpoints

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import ft_api, jwt_service
from app.models.user import User, UserRole
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login")
async def login():
    """Redirect to 42 OAuth login page"""
    return RedirectResponse(ft_api.get_authorization_url())


@router.get("/callback")
async def callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle 42 OAuth callback"""
    token_data = await ft_api.exchange_code_for_token(code)
    if "error" in token_data:
        raise HTTPException(status_code=400, detail="Failed to get token")
    
    user_info = await ft_api.get_user_info(token_data["access_token"])
    user = await db.get(User, user_info["id"])
    
    if not user:
        user = User(
            id=user_info["id"],
            login=user_info["login"],
            email=user_info["email"],
            display_name=user_info.get("displayname"),
            avatar_url=user_info.get("image", {}).get("link"),
            role=UserRole.STAFF if user_info.get("staff?") else UserRole.STUDENT,
            campus_id=user_info.get("campus", [{}])[0].get("id")
        )
        db.add(user)
    await db.commit()
    
    return RedirectResponse(
        f"http://localhost:5173/auth/callback?token={jwt_service.create_access_token(user.id)}"
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return {
        "id": current_user.id,
        "login": current_user.login,
        "email": current_user.email,
        "role": current_user.role.value,
        "avatar_url": current_user.avatar_url,
        "display_name": current_user.display_name
    }
