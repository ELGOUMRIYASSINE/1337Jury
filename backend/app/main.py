# 42Nexus - Main Application Entry Point
# This file is for: ADMIRAL (Backend Dev 1)
# Description: FastAPI main application with CORS and route registration

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, projects, votes, disputes, resources, tests

app = FastAPI(title="42Nexus API", description="Collaborative platform for 42 students")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Auth routes (Admiral)
app.include_router(auth.router, prefix="/api")
# Project routes (Admiral)
app.include_router(projects.router, prefix="/api")
# Voting routes (Admiral)
app.include_router(votes.router, prefix="/api")
# Disputes routes (Admiral)
app.include_router(disputes.router, prefix="/api")
# Resources routes (Zero)
app.include_router(resources.router, prefix="/api")
# Tests routes (Zero)
app.include_router(tests.router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "healthy"}
