"""
Luma Backend — Main Application Entry Point

FastAPI application with CORS, database initialization,
and route registration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.auth.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: create database tables
    init_db()
    print("Luma database initialized")
    yield
    # Shutdown: cleanup if needed
    print("Luma shutting down")


app = FastAPI(
    title="Luma API",
    description="AI Voice Companion & Personal Journal Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)


@app.get("/api/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "luma-api"}
