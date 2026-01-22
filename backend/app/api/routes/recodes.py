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


@router.get("/my")
async def list_my_recodes(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """List current user's recode requests"""
    result = await db.execute(
        select(RecodeRequest)
        .where(RecodeRequest.user_id == user.id)
        .order_by(RecodeRequest.created_at.desc())
    )
    recodes = result.scalars().all()
    
    enriched = []
    for r in recodes:
        data = r.to_dict()
        project_result = await db.execute(select(Project).where(Project.id == r.project_id))
        project = project_result.scalar_one_or_none()
        data["project_name"] = project.name if project else "Unknown Project"
        enriched.append(data)
    
    return enriched


@router.get("/campuses")
async def list_campuses():
    """List available 42/1337 campuses"""
    return [
        {"id": "khouribga", "name": "1337 Khouribga"},
        {"id": "benguerir", "name": "1337 Ben Guerir"},
        {"id": "tetouan", "name": "1337 Tetouan"},
        {"id": "med", "name": "1337 MED"},
        {"id": "rabat", "name": "1337 Rabat"},
        {"id": "paris", "name": "42 Paris"},
        {"id": "lyon", "name": "42 Lyon"},
        {"id": "nice", "name": "42 Nice"},
        {"id": "berlin", "name": "42 Berlin"},
        {"id": "london", "name": "42 London"},
        {"id": "tokyo", "name": "42 Tokyo"},
        {"id": "seoul", "name": "42 Seoul"},
        {"id": "other", "name": "Other"},
    ]


@router.get("/platforms")
async def list_platforms():
    """List available meeting platforms"""
    return [
        {"id": "discord", "name": "Discord", "icon": "🎮"},
        {"id": "google_meet", "name": "Google Meet", "icon": "📹"},
        {"id": "zoom", "name": "Zoom", "icon": "💻"},
        {"id": "teams", "name": "Microsoft Teams", "icon": "👥"},
        {"id": "slack", "name": "Slack Huddle", "icon": "💬"},
        {"id": "in_person", "name": "In Person", "icon": "🏫"},
        {"id": "other", "name": "Other", "icon": "🔗"},
    ]


@router.post("")
async def create_recode(
    data: RecodeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Create a new recode request"""
    # Check if project exists
    project_result = await db.execute(select(Project).where(Project.id == data.project_id))
    if not project_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")
    
    recode = RecodeRequest(
        user_id=user.id,
        project_id=data.project_id,
        campus=data.campus,
        meeting_platform=data.meeting_platform,
        meeting_link=data.meeting_link,
        description=data.description,
        status="open"
    )
    db.add(recode)
    await db.commit()
    await db.refresh(recode)
    return recode.to_dict()


@router.get("/{recode_id}")
async def get_recode(recode_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single recode request"""
    result = await db.execute(select(RecodeRequest).where(RecodeRequest.id == recode_id))
    recode = result.scalar_one_or_none()
    if not recode:
        raise HTTPException(status_code=404, detail="Recode request not found")
    
    data = recode.to_dict()
    
    # Enrich with user info
    user_result = await db.execute(select(User).where(User.id == recode.user_id))
    user = user_result.scalar_one_or_none()
    data["user_login"] = user.login if user else "Unknown"
    data["user_image"] = user.avatar_url if user else None
    
    return data


@router.put("/{recode_id}")
async def update_recode(
    recode_id: int,
    data: RecodeUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update a recode request (creator only)"""
    result = await db.execute(select(RecodeRequest).where(RecodeRequest.id == recode_id))
    recode = result.scalar_one_or_none()
    if not recode:
        raise HTTPException(status_code=404, detail="Recode request not found")
    if recode.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if recode.status != "open":
        raise HTTPException(status_code=400, detail="Can only edit open requests")
    
    if data.campus is not None:
        recode.campus = data.campus
    if data.meeting_platform is not None:
        recode.meeting_platform = data.meeting_platform
    if data.meeting_link is not None:
        recode.meeting_link = data.meeting_link
    if data.description is not None:
        recode.description = data.description
    
    await db.commit()
    await db.refresh(recode)
    return recode.to_dict()


@router.post("/{recode_id}/accept")
async def accept_recode(
    recode_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Accept a recode request (become the recoder)"""
    result = await db.execute(select(RecodeRequest).where(RecodeRequest.id == recode_id))
    recode = result.scalar_one_or_none()
    if not recode:
        raise HTTPException(status_code=404, detail="Recode request not found")
    if recode.status != "open":
        raise HTTPException(status_code=400, detail="Request is not open")
    if recode.user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot accept your own request")
    
    recode.status = "matched"
    recode.matched_user_id = user.id
    await db.commit()
    
    return {"message": "You've accepted to recode!", "recode": recode.to_dict()}


@router.post("/{recode_id}/complete")
async def complete_recode(
    recode_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Mark recode as completed (creator or recoder)"""
    result = await db.execute(select(RecodeRequest).where(RecodeRequest.id == recode_id))
    recode = result.scalar_one_or_none()
    if not recode:
        raise HTTPException(status_code=404, detail="Recode request not found")
    if recode.user_id != user.id and recode.matched_user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    recode.status = "completed"
    await db.commit()
    return {"message": "Recode completed!"}


@router.post("/{recode_id}/cancel")
async def cancel_recode(
    recode_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Cancel a recode request (creator only)"""
    result = await db.execute(select(RecodeRequest).where(RecodeRequest.id == recode_id))
    recode = result.scalar_one_or_none()
    if not recode:
        raise HTTPException(status_code=404, detail="Recode request not found")
    if recode.user_id != user.id and not user.is_staff:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    recode.status = "cancelled"
    await db.commit()
    return {"message": "Request cancelled"}
