# 42Nexus - Tests Repository Routes
# This file is for: ZERO (Backend Dev 2)
# Description: Test cases repository with staff approval system

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from app.database import get_db
from app.models.test import Test
from app.models.user import User
from app.middleware.auth import get_current_user, get_current_staff

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("/")
async def list_tests(
    project_id: Optional[int] = None,
    approved_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List all test cases with optional filters"""
    query = select(Test).options(
        selectinload(Test.user),
        selectinload(Test.project)
    )
    if project_id:
        query = query.where(Test.project_id == project_id)
    if approved_only:
        query = query.where(Test.is_approved == True)
    
    result = await db.execute(query.order_by(Test.downloads.desc()))
    tests = result.scalars().all()
    
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "language": t.language,
            "downloads": t.downloads,
            "is_approved": t.is_approved,
            "user_login": t.user.login,
            "project_name": t.project.name,
            "code_preview": t.code[:200] + "..." if len(t.code) > 200 else t.code,
            "created_at": t.created_at
        }
        for t in tests
    ]


@router.get("/{test_id}")
async def get_test(test_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific test with full code"""
    result = await db.execute(
        select(Test)
        .options(selectinload(Test.user), selectinload(Test.project))
        .where(Test.id == test_id)
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return {
        "id": test.id,
        "title": test.title,
        "description": test.description,
        "code": test.code,
        "language": test.language,
        "downloads": test.downloads,
        "is_approved": test.is_approved,
        "user_login": test.user.login,
        "project_name": test.project.name,
        "created_at": test.created_at
    }


@router.post("/")
async def create_test(
    project_id: int,
    title: str,
    code: str,
    description: Optional[str] = None,
    language: str = "python",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a new test case"""
    test = Test(
        project_id=project_id,
        user_id=current_user.id,
        title=title,
        description=description,
        code=code,
        language=language
    )
    db.add(test)
    await db.commit()
    return {"id": test.id, "message": "Test submitted successfully"}


@router.get("/{test_id}/download")
async def download_test(test_id: int, db: AsyncSession = Depends(get_db)):
    """Download a test file and increment download counter"""
    test = await db.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test.downloads += 1
    await db.commit()
    
    filename = test.title.replace(" ", "_")
    return PlainTextResponse(
        content=test.code,
        headers={"Content-Disposition": f"attachment; filename={filename}.py"}
    )


@router.post("/{test_id}/approve")
async def approve_test(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """Staff approves a test case"""
    test = await db.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test.is_approved = True
    await db.commit()
    return {"message": "Test approved successfully", "approved_by": current_user.login}


@router.post("/{test_id}/unapprove")
async def unapprove_test(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_staff)
):
    """Staff removes approval from a test case"""
    test = await db.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    test.is_approved = False
    await db.commit()
    return {"message": "Test approval removed"}


@router.delete("/{test_id}")
async def delete_test(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a test (owner or staff only)"""
    test = await db.get(Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if test.user_id != current_user.id and current_user.role.value != "staff":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(test)
    await db.commit()
    return {"message": "Test deleted successfully"}
