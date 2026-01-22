# 1337Jury - Projects Routes
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Project listing and management endpoints
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.project import Project
from app.middleware.auth import get_current_user, get_staff_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None


@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    return [p.to_dict() for p in projects]


@router.get("/{project_id}")
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.to_dict()


@router.post("")
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_staff_user)
):
    project = Project(name=data.name, slug=data.slug, description=data.description)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project.to_dict()