# 42Nexus - Resources Routes
# This file is for: ZERO (Backend Dev 2)
# Description: Learning resources hub with upvote/downvote system

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from app.database import get_db
from app.models.resource import Resource
from app.models.resource_vote import ResourceVote
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/")
async def list_resources(
    project_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all resources with optional filters"""
    query = select(Resource).options(
        selectinload(Resource.user),
        selectinload(Resource.project),
        selectinload(Resource.votes)
    )
    if project_id:
        query = query.where(Resource.project_id == project_id)
    if resource_type:
        query = query.where(Resource.resource_type == resource_type)
    if search:
        query = query.where(Resource.title.ilike(f"%{search}%"))
    
    result = await db.execute(query.order_by(Resource.created_at.desc()))
    resources = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "url": r.url,
            "resource_type": r.resource_type.value,
            "user_login": r.user.login,
            "project_name": r.project.name,
            "upvotes": sum(1 for v in r.votes if v.is_upvote),
            "downvotes": sum(1 for v in r.votes if not v.is_upvote),
            "created_at": r.created_at
        }
        for r in resources
    ]


@router.post("/")
async def create_resource(
    project_id: int,
    title: str,
    url: str,
    description: Optional[str] = None,
    resource_type: str = "other",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new learning resource"""
    resource = Resource(
        project_id=project_id,
        user_id=current_user.id,
        title=title,
        description=description,
        url=url,
        resource_type=resource_type
    )
    db.add(resource)
    await db.commit()
    return {"id": resource.id, "message": "Resource created successfully"}


@router.get("/{resource_id}")
async def get_resource(resource_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific resource"""
    result = await db.execute(
        select(Resource)
        .options(
            selectinload(Resource.user),
            selectinload(Resource.project),
            selectinload(Resource.votes)
        )
        .where(Resource.id == resource_id)
    )
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return {
        "id": resource.id,
        "title": resource.title,
        "description": resource.description,
        "url": resource.url,
        "resource_type": resource.resource_type.value,
        "user_login": resource.user.login,
        "project_name": resource.project.name,
        "upvotes": sum(1 for v in resource.votes if v.is_upvote),
        "downvotes": sum(1 for v in resource.votes if not v.is_upvote),
        "created_at": resource.created_at
    }


@router.post("/{resource_id}/vote")
async def vote_resource(
    resource_id: int,
    is_upvote: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upvote or downvote a resource"""
    resource = await db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    existing = await db.execute(
        select(ResourceVote).where(
            ResourceVote.resource_id == resource_id,
            ResourceVote.user_id == current_user.id
        )
    )
    vote = existing.scalar_one_or_none()
    
    if vote:
        if vote.is_upvote == is_upvote:
            await db.delete(vote)  # Toggle off
            message = "Vote removed"
        else:
            vote.is_upvote = is_upvote  # Change vote
            message = "Vote changed"
    else:
        db.add(ResourceVote(
            resource_id=resource_id,
            user_id=current_user.id,
            is_upvote=is_upvote
        ))
        message = "Vote recorded"
    
    await db.commit()
    return {"message": message}


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a resource (owner or staff only)"""
    resource = await db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.user_id != current_user.id and current_user.role.value != "staff":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(resource)
    await db.commit()
    return {"message": "Resource deleted successfully"}
