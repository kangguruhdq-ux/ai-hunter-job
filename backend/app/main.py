import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.database import init_db

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting JobHunter AI backend...")
    # Ensure upload and data directories exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs("./data", exist_ok=True)
    # Initialize database tables
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    yield
    logger.info("Shutting down JobHunter AI backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="JobHunter AI — Intelligent Job Search and Application Assistant API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "ai_provider": settings.AI_PROVIDER,
        "configured_model": settings.GEMINI_MODEL if settings.AI_PROVIDER == "gemini" else "mock-engine",
        "environment": settings.ENVIRONMENT
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

from app.api.v1 import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)

