# 42Nexus - Live Disputes Routes
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Correction dispute management with STAFF OVERRIDE feature

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.dispute import Dispute, DisputeStatus, DisputeUrgency, DisputeWinner
from app.models.dispute_vote import DisputeVote
from app.models.user import User
from app.middleware.auth import get_current_user, get_current_staff

router = APIRouter(prefix="/disputes", tags=["disputes"])


@router.get("/")
async def list_disputes(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    urgency: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all disputes with optional filters"""
    query = select(Dispute).options(
        selectinload(Dispute.votes),
        selectinload(Dispute.creator),
        selectinload(Dispute.project)
    )
    if project_id:
        query = query.where(Dispute.project_id == project_id)
    if status:
        query = query.where(Dispute.status == status)
    if urgency:
        query = query.where(Dispute.urgency == urgency)
    
    result = await db.execute(query.order_by(Dispute.created_at.desc()))
    disputes = result.scalars().all()
    
    return [
        {
            "id": d.id,
            "description": d.description,
            "corrector_opinion": d.corrector_opinion,
            "corrected_opinion": d.corrected_opinion,
            "urgency": d.urgency.value,
            "status": d.status.value,
            "winner": d.winner.value if d.winner else None,
            "creator_login": d.creator.login,
            "project_name": d.project.name,
            "corrector_votes": sum(1 for v in d.votes if v.vote_for == DisputeWinner.CORRECTOR),
            "corrected_votes": sum(1 for v in d.votes if v.vote_for == DisputeWinner.CORRECTED),
            "created_at": d.created_at,
            "resolved_at": d.resolved_at
        }
        for d in disputes
    ]


@router.post("/")
async def create_dispute(
    project_id: int,
    description: str,
    corrector_opinion: str,
    corrected_opinion: str,
    urgency: str = "medium",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new correction dispute"""
    dispute = Dispute(
        project_id=project_id,
        creator_id=current_user.id,
        description=description,
        corrector_opinion=corrector_opinion,
        corrected_opinion=corrected_opinion,
        urgency=DisputeUrgency(urgency)
    )
    db.add(dispute)
    await db.commit()
    return {"id": dispute.id, "message": "Dispute created successfully"}


@router.get("/{dispute_id}")
async def get_dispute(dispute_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific dispute with all details"""
    result = await db.execute(
        select(Dispute)
        .options(
            selectinload(Dispute.votes),
            selectinload(Dispute.creator),
            selectinload(Dispute.project)
        )
        .where(Dispute.id == dispute_id)
    )
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    return {
        "id": dispute.id,
        "description": dispute.description,
        "corrector_opinion": dispute.corrector_opinion,
        "corrected_opinion": dispute.corrected_opinion,
        "urgency": dispute.urgency.value,
        "status": dispute.status.value,
        "winner": dispute.winner.value if dispute.winner else None,
        "creator_login": dispute.creator.login,
        "project_name": dispute.project.name,
        "corrector_votes": sum(1 for v in dispute.votes if v.vote_for == DisputeWinner.CORRECTOR),
        "corrected_votes": sum(1 for v in dispute.votes if v.vote_for == DisputeWinner.CORRECTED),
        "created_at": dispute.created_at,
        "resolved_at": dispute.resolved_at
    }


@router.post("/{dispute_id}/vote")
async def vote_dispute(
    dispute_id: int,
    vote_for: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vote on a dispute (corrector or corrected)"""
    dispute = await db.get(Dispute, dispute_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute.status != DisputeStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Dispute is not active")
    
    existing = await db.execute(
        select(DisputeVote).where(
            DisputeVote.dispute_id == dispute_id,
            DisputeVote.user_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already voted on this dispute")
    
    db.add(DisputeVote(
        dispute_id=dispute_id,
        user_id=current_user.id,
        vote_for=DisputeWinner(vote_for)
    ))
    await db.commit()
    return {"message": "Vote recorded successfully"}


@router.post("/{dispute_id}/staff-decide")
async def staff_decide_dispute(
    dispute_id: int,
    winner: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """
    STAFF OVERRIDE: Staff member decides the winner
    Decision is FINAL - even if 100 people voted differently!
    """
    dispute = await db.get(Dispute, dispute_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    dispute.status = DisputeStatus.STAFF_DECIDED
    dispute.winner = DisputeWinner(winner)
    dispute.staff_user_id = current_user.id
    dispute.resolved_at = datetime.utcnow()
    
    await db.commit()
    return {
        "message": "Staff decision recorded - FINAL",
        "winner": winner,
        "decided_by": current_user.login
    }
