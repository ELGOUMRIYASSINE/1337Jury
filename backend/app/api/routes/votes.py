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


@router.post("")
async def create_vote(
    data: VoteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if len(data.options) < 2:
        raise HTTPException(status_code=400, detail="At least 2 options required")

    vote = SubjectVote(
        title=data.title,
        description=data.description,
        project_id=data.project_id,
        user_id=user.id,
    )
    db.add(vote)
    await db.flush()

    for option_text in data.options:
        option = VoteOption(subject_vote_id=vote.id, text=option_text)
        db.add(option)

    await db.commit()
    await db.refresh(vote)
    return vote.to_dict()


@router.post("/{vote_id}/cast")
async def cast_vote(
    vote_id: int,
    data: CastVote,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Check vote exists and is open
    result = await db.execute(select(SubjectVote).where(SubjectVote.id == vote_id))
    vote = result.scalar_one_or_none()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    if vote.status != VoteStatus.OPEN:
        raise HTTPException(status_code=400, detail="Vote is closed")

    result = await db.execute(select(VoteOption).where(VoteOption.id == data.option_id))
    option = result.scalar_one_or_none()
    if not option or option.subject_vote_id != vote_id:
        raise HTTPException(status_code=400, detail="Invalid option")

    # Check if user already voted
    result = await db.execute(
        select(UserVote).where(UserVote.subject_vote_id == vote_id, UserVote.user_id == user.id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Change vote
        old_option = await db.execute(select(VoteOption).where(VoteOption.id == existing.option_id))
        old_opt = old_option.scalar_one()
        old_opt.vote_count -= 1
        existing.option_id = data.option_id
        option.vote_count += 1
    else:
        # New vote
        user_vote = UserVote(subject_vote_id=vote_id, option_id=data.option_id, user_id=user.id)
        db.add(user_vote)
        option.vote_count += 1

    await db.commit()
    return {"message": "Vote cast"}


@router.post("/{vote_id}/staff-decision")
async def staff_decision(
    vote_id: int,
    data: StaffDecision,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_staff_user)
):
    """STAFF OVERRIDE: Staff decision is FINAL regardless of votes"""
    result = await db.execute(select(SubjectVote).where(SubjectVote.id == vote_id))
    vote = result.scalar_one_or_none()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")

    vote.status = VoteStatus.STAFF_DECIDED
    vote.winning_option_id = data.winning_option_id
    vote.staff_decision_by = user.id
    vote.staff_decision_reason = data.reason
    vote.closed_at = datetime.now(timezone.utc)

    await db.commit()
    return {"message": "Staff decision applied - THIS IS FINAL"}


@router.post("/{vote_id}/close")
async def close_vote(
    vote_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(SubjectVote).where(SubjectVote.id == vote_id))
    vote = result.scalar_one_or_none()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    if vote.user_id != user.id and not user.is_staff:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find winning option
    options_result = await db.execute(
        select(VoteOption).where(VoteOption.subject_vote_id == vote_id).order_by(VoteOption.vote_count.desc())
    )
    options = options_result.scalars().all()
    if options:
        vote.winning_option_id = options[0].id

    vote.status = VoteStatus.CLOSED
    vote.closed_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Vote closed"}


class VoteUpdate(BaseModel):
    title: str | None = None
    description: str | None = None