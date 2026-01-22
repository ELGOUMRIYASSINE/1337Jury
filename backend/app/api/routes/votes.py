# 1337Jury - Subject Voting Routes
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Subject clarification voting with STAFF OVERRIDE feature

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models.subject_vote import SubjectVote, VoteStatus
from app.models.vote_option import VoteOption
from app.models.user_vote import UserVote
from app.models.user import User
from app.middleware.auth import get_current_user, get_staff_user
from pydantic import BaseModel

router = APIRouter(prefix="/votes", tags=["Subject Votes"])


class VoteCreate(BaseModel):
    title: str
    description: str
    project_id: int
    options: list[str]


class CastVote(BaseModel):
    option_id: int


class StaffDecision(BaseModel):
    winning_option_id: int
    reason: str | None = None


@router.get("")
async def list_votes(project_id: int | None = None, status: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(SubjectVote)
    if project_id:
        query = query.where(SubjectVote.project_id == project_id)
    if status:
        query = query.where(SubjectVote.status == VoteStatus(status))
    query = query.order_by(SubjectVote.created_at.desc())
    result = await db.execute(query)
    return [v.to_dict() for v in result.scalars().all()]


@router.get("/{vote_id}")
async def get_vote(vote_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubjectVote).where(SubjectVote.id == vote_id))
    vote = result.scalar_one_or_none()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    options_result = await db.execute(select(VoteOption).where(VoteOption.subject_vote_id == vote_id))
    options = [o.to_dict() for o in options_result.scalars().all()]
    
    vote_dict = vote.to_dict()
    vote_dict["options"] = options
    return vote_dict