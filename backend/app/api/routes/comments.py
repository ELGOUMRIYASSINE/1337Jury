from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.comment import Comment
from app.models.user import User
from app.middleware.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/comments", tags=["Comments"])


class CommentCreate(BaseModel):
    content: str
    vote_id: Optional[int] = None
    dispute_id: Optional[int] = None
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: str


@router.get("")
async def list_comments(
    vote_id: Optional[int] = None,
    dispute_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """List comments for a vote or dispute"""
    query = select(Comment, User.login, User.avatar_url).join(User, Comment.user_id == User.id)
    
    if vote_id:
        query = query.where(Comment.vote_id == vote_id)
    elif dispute_id:
        query = query.where(Comment.dispute_id == dispute_id)
    else:
        # Return recent comments
        query = query.order_by(Comment.created_at.desc()).limit(100)
    
    query = query.order_by(Comment.created_at.asc())
    result = await db.execute(query)
    rows = result.all()
    
    comments = []
    for comment, user_login, avatar_url in rows:
        c = comment.to_dict()
        c["user_login"] = user_login
        c["avatar_url"] = avatar_url
        comments.append(c)
    
    return comments