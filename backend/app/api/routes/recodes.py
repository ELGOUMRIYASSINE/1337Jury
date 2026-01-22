# Recode Requests Routes - Mock Evaluation & Recoding
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.recode_request import RecodeRequest
from app.models.user import User
from app.models.project import Project
from app.middleware.auth import get_current_user, get_staff_user
from pydantic import BaseModel

router = APIRouter(prefix="/recodes", tags=["Recode Requests"])

class RecodeCreate(BaseModel):
    project_id: int
    campus: str
    meeting_platform: str
    meeting_link: str | None = None
    description: str | None = None


class RecodeUpdate(BaseModel):
    campus: str | None = None
    meeting_platform: str | None = None
    meeting_link: str | None = None
    description: str | None = None


@router.get("")
async def list_recodes(
    project_id: int | None = None,
    campus: str | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """List all recode requests with optional filters"""
    query = select(RecodeRequest).order_by(RecodeRequest.created_at.desc())
    
    if project_id:
        query = query.where(RecodeRequest.project_id == project_id)
    if campus:
        query = query.where(RecodeRequest.campus == campus)
    if status and status != "all":
        query = query.where(RecodeRequest.status == status)
    elif not status:
        # By default, show only open requests
        query = query.where(RecodeRequest.status == "open")
    # If status == "all", don't filter by status
    
    result = await db.execute(query)
    recodes = result.scalars().all()
    
    # Enrich with user and project info
    enriched = []
    for r in recodes:
        data = r.to_dict()
        # Get user info
        user_result = await db.execute(select(User).where(User.id == r.user_id))
        user = user_result.scalar_one_or_none()
        data["user_login"] = user.login if user else "Unknown"
        data["user_image"] = user.avatar_url if user else None
        
        # Get project info
        project_result = await db.execute(select(Project).where(Project.id == r.project_id))
        project = project_result.scalar_one_or_none()
        data["project_name"] = project.name if project else "Unknown Project"
        
        # Get matched user info if exists
        if r.matched_user_id:
            matched_result = await db.execute(select(User).where(User.id == r.matched_user_id))
            matched = matched_result.scalar_one_or_none()
            data["matched_user_login"] = matched.login if matched else None
        
        enriched.append(data)
    
    return enriched
