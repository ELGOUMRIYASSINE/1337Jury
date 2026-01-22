# 1337Jury - Live Disputes Routes
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Correction dispute management with STAFF OVERRIDE feature

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models.dispute import Dispute, DisputeStatus, DisputeWinner
from app.models.dispute_vote import DisputeVote
from app.models.user import User
from app.middleware.auth import get_current_user, get_staff_user
from pydantic import BaseModel

router = APIRouter(prefix="/disputes", tags=["Disputes"])


class DisputeCreate(BaseModel):
    title: str
    description: str
    project_id: int
    corrector_username: str
    corrected_username: str


class DisputeVoteRequest(BaseModel):
    vote_for: str


class StaffDecision(BaseModel):
    winner: str 
    reason: str | None = None


@router.get("")
async def list_disputes(
    project_id: int | None = None,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = select(Dispute)
    if project_id:
        query = query.where(Dispute.project_id == project_id)
    if status:
        query = query.where(Dispute.status == DisputeStatus(status))
    query = query.order_by(Dispute.created_at.desc())
    result = await db.execute(query)
    disputes = result.scalars().all()

    output = []
    for d in disputes:
        dispute_dict = d.to_dict()
        if d.corrector_id == user.id:
            corrector_result = await db.execute(select(User).where(User.id == d.corrector_id))
            corrector = corrector_result.scalar_one_or_none()
            dispute_dict["corrector_username"] = corrector.login if corrector else None
        else:
            dispute_dict["corrector_username"] = None
        
        if d.corrected_id == user.id:
            corrected_result = await db.execute(select(User).where(User.id == d.corrected_id))
            corrected = corrected_result.scalar_one_or_none()
            dispute_dict["corrected_username"] = corrected.login if corrected else None
        else:
            dispute_dict["corrected_username"] = None
        
        output.append(dispute_dict)
    
    return output


@router.get("/{dispute_id}")
async def get_dispute(
    dispute_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(Dispute).where(Dispute.id == dispute_id))
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    dispute_dict = dispute.to_dict()

    if dispute.corrector_id == user.id:
        corrector_result = await db.execute(select(User).where(User.id == dispute.corrector_id))
        corrector = corrector_result.scalar_one_or_none()
        dispute_dict["corrector_username"] = corrector.login if corrector else None
    else:
        dispute_dict["corrector_username"] = None
    
    if dispute.corrected_id == user.id:
        corrected_result = await db.execute(select(User).where(User.id == dispute.corrected_id))
        corrected = corrected_result.scalar_one_or_none()
        dispute_dict["corrected_username"] = corrected.login if corrected else None
    else:
        dispute_dict["corrected_username"] = None
    
    return dispute_dict


