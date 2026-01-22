# 1337Jury - Tests Repository Routes
# This file is for: ZERO (Backend Dev 2)
# Description: Test cases repository with staff approval system

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.test import Test
from app.models.user import User
from app.middleware.auth import get_current_user, get_staff_user
from pydantic import BaseModel

router = APIRouter(prefix="/tests", tags=["Tests"])


class TestCreate(BaseModel):
    title: str
    description: str | None = None
    github_url: str
    project_id: int


@router.get("")
async def list_tests(
    project_id: int | None = None,
    approved_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    query = select(Test)
    if project_id:
        query = query.where(Test.project_id == project_id)
    if approved_only:
        query = query.where(Test.is_approved == True)
    query = query.order_by(Test.downloads.desc())
    result = await db.execute(query)
    return [t.to_dict() for t in result.scalars().all()]