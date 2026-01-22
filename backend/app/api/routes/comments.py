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


@router.post("")
async def create_comment(
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new comment"""
    if not data.vote_id and not data.dispute_id:
        raise HTTPException(status_code=400, detail="Must specify vote_id or dispute_id")
    
    comment = Comment(
        content=data.content,
        user_id=current_user.id,
        vote_id=data.vote_id,
        dispute_id=data.dispute_id,
        parent_id=data.parent_id
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    result = comment.to_dict()
    result["user_login"] = current_user.login
    result["avatar_url"] = current_user.avatar_url
    return result


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (owner or staff only)"""
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment.user_id != current_user.id and not current_user.is_staff:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted"}


@router.get("/count")
async def get_comment_counts(
    vote_ids: Optional[str] = None,
    dispute_ids: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get comment counts for multiple votes/disputes"""
    from sqlalchemy import func
    
    counts = {}
    
    if vote_ids:
        ids = [int(x) for x in vote_ids.split(",") if x]
        for vid in ids:
            result = await db.execute(
                select(func.count(Comment.id)).where(Comment.vote_id == vid)
            )
            counts[f"vote-{vid}"] = result.scalar() or 0
    
    if dispute_ids:
        ids = [int(x) for x in dispute_ids.split(",") if x]
        for did in ids:
            result = await db.execute(
                select(func.count(Comment.id)).where(Comment.dispute_id == did)
            )
            counts[f"dispute-{did}"] = result.scalar() or 0
    
    return counts