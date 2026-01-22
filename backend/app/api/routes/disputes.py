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