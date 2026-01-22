# 1337Jury - Main Application Entry Point
# This file is for: ADMIRAL (Backend Dev 1)
# Description: FastAPI main application with CORS and route registration

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.routes import auth, projects, resources, votes, disputes, tests, comments, recodes


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
        print("✅ Database initialized")
    except Exception as e:
        print(f"⚠️ DB Error: {e}")
    yield


app = FastAPI(title="LeetJury API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(votes.router, prefix="/api")
app.include_router(disputes.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(recodes.router, prefix="/api")


@app.get("/")
async def root():
    return {"name": "LeetJury API", "status": "running"}