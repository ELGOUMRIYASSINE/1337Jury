# 42Nexus - Projects Routes
# This file is for: ADMIRAL (Backend Dev 1)
# Description: Project listing and management endpoints

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.project import Project

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
async def list_projects(db: AsyncSession = Depends(get_db)):
    """List all projects ordered by order_index"""
    result = await db.execute(select(Project).order_by(Project.order_index))
    projects = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "order_index": p.order_index
        }
        for p in projects
    ]


@router.get("/{project_id}")
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific project by ID"""
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "order_index": project.order_index
    }


@router.get("/slug/{slug}")
async def get_project_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a specific project by slug"""
    result = await db.execute(select(Project).where(Project.slug == slug))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "slug": project.slug,
        "description": project.description,
        "order_index": project.order_index
    }
