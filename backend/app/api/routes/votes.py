# 42Nexus - Subject Voting Routes
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Subject clarification voting with STAFF OVERRIDE feature

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.subject_vote import SubjectVote, VoteStatus
from app.models.vote_option import VoteOption
from app.models.user_vote import UserVote
from app.models.user import User
from app.middleware.auth import get_current_user, get_current_user_optional, get_current_staff

router = APIRouter(prefix="/votes", tags=["votes"])


@router.get("/")
async def list_votes(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all subject votes with optional filters"""
    query = select(SubjectVote).options(
        selectinload(SubjectVote.options).selectinload(VoteOption.user_votes),
        selectinload(SubjectVote.user),
        selectinload(SubjectVote.project)
    )
    if project_id:
        query = query.where(SubjectVote.project_id == project_id)
    if status:
        query = query.where(SubjectVote.status == status)
    
    result = await db.execute(query.order_by(SubjectVote.created_at.desc()))
    votes = result.scalars().all()
    
    return [
        {
            "id": v.id,
            "question": v.question,
            "context": v.context,
            "status": v.status.value,
            "staff_decision": v.staff_decision,
            "user_login": v.user.login,
            "project_name": v.project.name,
            "options": [
                {
                    "id": o.id,
                    "text": o.option_text,
                    "vote_count": len(o.user_votes)
                }
                for o in v.options
            ],
            "created_at": v.created_at,
            "resolved_at": v.resolved_at
        }
        for v in votes
    ]


@router.post("/")
async def create_vote(
    project_id: int,
    question: str,
    options: list[str],
    context: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new subject clarification vote"""
    if len(options) < 2:
        raise HTTPException(status_code=400, detail="At least 2 options required")
    
    vote = SubjectVote(
        project_id=project_id,
        user_id=current_user.id,
        question=question,
        context=context
    )
    db.add(vote)
    await db.flush()
    
    for opt in options:
        db.add(VoteOption(subject_vote_id=vote.id, option_text=opt))
    
    await db.commit()
    return {"id": vote.id, "message": "Vote created successfully"}


@router.get("/{vote_id}")
async def get_vote(vote_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific vote with all details"""
    result = await db.execute(
        select(SubjectVote)
        .options(
            selectinload(SubjectVote.options).selectinload(VoteOption.user_votes),
            selectinload(SubjectVote.user),
            selectinload(SubjectVote.project)
        )
        .where(SubjectVote.id == vote_id)
    )
    vote = result.scalar_one_or_none()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    return {
        "id": vote.id,
        "question": vote.question,
        "context": vote.context,
        "status": vote.status.value,
        "staff_decision": vote.staff_decision,
        "user_login": vote.user.login,
        "project_name": vote.project.name,
        "options": [
            {"id": o.id, "text": o.option_text, "vote_count": len(o.user_votes)}
            for o in vote.options
        ],
        "created_at": vote.created_at,
        "resolved_at": vote.resolved_at
    }


@router.post("/{vote_id}/vote")
async def cast_vote(
    vote_id: int,
    option_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cast a vote on a subject clarification question"""
    vote = await db.get(SubjectVote, vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    if vote.status != VoteStatus.OPEN:
        raise HTTPException(status_code=400, detail="Vote is not open")
    
    existing = await db.execute(
        select(UserVote).where(
            UserVote.subject_vote_id == vote_id,
            UserVote.user_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already voted")
    
    db.add(UserVote(
        subject_vote_id=vote_id,
        option_id=option_id,
        user_id=current_user.id
    ))
    await db.commit()
    return {"message": "Vote recorded successfully"}


@router.post("/{vote_id}/staff-decide")
async def staff_decide(
    vote_id: int,
    decision: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    STAFF OVERRIDE: Staff member makes final decision
    Decision is FINAL - even if 100 people voted differently!
    """
    vote = await db.get(SubjectVote, vote_id)
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    vote.status = VoteStatus.STAFF_DECIDED
    vote.staff_decision = decision
    vote.staff_user_id = current_user.id
    vote.resolved_at = datetime.utcnow()
    
    await db.commit()
    return {
        "message": "Staff decision recorded - FINAL",
        "decision": decision,
        "decided_by": current_user.login
    }
