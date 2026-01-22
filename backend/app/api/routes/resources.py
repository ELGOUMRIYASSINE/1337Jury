# 1337Jury - Resources Routes
# This file is for: ZERO (Backend Dev 2)
# Description: Learning resources hub with upvote/downvote system

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.resource import Resource, ResourceType
from app.models.resource_vote import ResourceVote
from app.models.user import User
from app.middleware.auth import get_current_user, get_current_user_optional
from pydantic import BaseModel

router = APIRouter(prefix="/resources", tags=["Resources"])


class ResourceCreate(BaseModel):
    title: str
    url: str
    description: str | None = None
    resource_type: str = "other"
    project_id: int


class VoteRequest(BaseModel):
    is_upvote: bool


@router.get("")
async def list_resources(project_id: int | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Resource)
    if project_id:
        query = query.where(Resource.project_id == project_id)
    query = query.order_by((Resource.upvotes - Resource.downvotes).desc())
    result = await db.execute(query)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("")
async def create_resource(
    data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    resource = Resource(
        title=data.title,
        url=data.url,
        description=data.description,
        resource_type=ResourceType(data.resource_type),
        project_id=data.project_id,
        user_id=user.id,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource.to_dict()

@router.post("/{resource_id}/vote")
async def vote_resource(
    resource_id: int,
    data: VoteRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    result = await db.execute(
        select(ResourceVote).where(
            ResourceVote.resource_id == resource_id,
            ResourceVote.user_id == user.id
        )
    )
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        if existing_vote.is_upvote == data.is_upvote:
            if existing_vote.is_upvote:
                resource.upvotes -= 1
            else:
                resource.downvotes -= 1
            await db.delete(existing_vote)
        else:
            if data.is_upvote:
                resource.upvotes += 1
                resource.downvotes -= 1
            else:
                resource.upvotes -= 1
                resource.downvotes += 1
            existing_vote.is_upvote = data.is_upvote
    else:
        vote = ResourceVote(resource_id=resource_id, user_id=user.id, is_upvote=data.is_upvote)
        db.add(vote)
        if data.is_upvote:
            resource.upvotes += 1
        else:
            resource.downvotes += 1

    await db.commit()
    await db.refresh(resource)
    return resource.to_dict()


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.user_id != user.id and not user.is_staff:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(resource)
    await db.commit()
    return {"message": "Deleted"}
