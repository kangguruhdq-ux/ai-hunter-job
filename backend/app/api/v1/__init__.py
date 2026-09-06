from fastapi import APIRouter
from app.api.v1.resume import router as resume_router
from app.api.v1.profile import router as profile_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.match import router as match_router
from app.api.v1.documents import router as documents_router

api_router = APIRouter()
api_router.include_router(resume_router)
api_router.include_router(profile_router)
api_router.include_router(jobs_router)
api_router.include_router(match_router)
api_router.include_router(documents_router)




